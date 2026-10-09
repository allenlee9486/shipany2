import { AITaskStatus } from '@/extensions/ai';
import { respOk } from '@/shared/lib/resp';
import {
  findAITaskByTaskId,
  UpdateAITask,
  updateAITaskById,
} from '@/shared/models/ai_task';
import { getAIService } from '@/shared/services/ai';

// Provider webhook endpoint, e.g. fal posts here when a generation finishes:
// { request_id, gateway_request_id, status: "OK" | "ERROR", payload, error }
//
// The payload body is not trusted; we only use `request_id` to locate our
// task and then re-query the provider API for the authoritative result
// (which also copies generated files to custom storage when enabled).
// Returning a non-2xx response makes the provider retry delivery.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  try {
    const body = await req.json().catch(() => null);
    const providerTaskId = body?.request_id;

    if (!providerTaskId || typeof providerTaskId !== 'string') {
      // nothing actionable; acknowledge so the provider stops retrying
      return respOk();
    }

    const task = await findAITaskByTaskId(providerTaskId);
    if (!task) {
      // unknown task id (e.g. requests made outside the app); acknowledge
      return respOk();
    }

    // already finished (the browser polling may have processed it first)
    if (
      task.status === AITaskStatus.SUCCESS ||
      task.status === AITaskStatus.FAILED
    ) {
      return respOk();
    }

    const aiService = await getAIService();
    const aiProvider = aiService.getProvider(task.provider || provider);
    if (!aiProvider) {
      return respOk();
    }

    const result = await aiProvider.query?.({
      taskId: task.taskId,
      mediaType: task.mediaType as any,
      model: task.model,
    });

    if (!result?.taskStatus) {
      throw new Error('query ai task failed');
    }

    // provider not done yet (propagation delay): ask to be retried later
    if (
      result.taskStatus === AITaskStatus.PENDING ||
      result.taskStatus === AITaskStatus.PROCESSING
    ) {
      return Response.json(
        { code: -1, message: 'task still in progress, retry later' },
        { status: 500 }
      );
    }

    const updateAITask: UpdateAITask = {
      status: result.taskStatus,
      taskInfo: result.taskInfo ? JSON.stringify(result.taskInfo) : null,
      taskResult: result.taskResult ? JSON.stringify(result.taskResult) : null,
      creditId: task.creditId,
    };

    if (updateAITask.taskInfo !== task.taskInfo) {
      // a failed status also revokes the consumed credits
      await updateAITaskById(task.id, updateAITask);
    }

    return respOk();
  } catch (e: any) {
    console.log('ai notify failed', e?.message || e);
    // transient failure: return non-2xx so the provider retries
    return Response.json(
      { code: -1, message: 'notify handler failed, retry later' },
      { status: 500 }
    );
  }
}
