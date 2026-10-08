'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { SmartIcon } from '@/shared/blocks/common';
import { PaymentModal } from '@/shared/blocks/payment/payment-modal';
import { Badge } from '@/shared/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { useAppContext } from '@/shared/contexts/app';
import { getCookie } from '@/shared/lib/cookie';
import { cn } from '@/shared/lib/utils';
import { Subscription } from '@/shared/models/subscription';
import {
  PricingCurrency,
  PricingItem,
  Pricing as PricingType,
} from '@/shared/types/blocks/pricing';

// Helper function to get all available currencies from a pricing item
function getCurrenciesFromItem(item: PricingItem | null): PricingCurrency[] {
  if (!item) return [];

  // Always include the default currency first
  const defaultCurrency: PricingCurrency = {
    currency: item.currency,
    amount: item.amount,
    price: item.price || '',
    original_price: item.original_price || '',
  };

  // Add additional currencies if available
  if (item.currencies && item.currencies.length > 0) {
    return [defaultCurrency, ...item.currencies];
  }

  return [defaultCurrency];
}

// Helper function to select initial currency based on locale
function getInitialCurrency(
  currencies: PricingCurrency[],
  locale: string,
  defaultCurrency: string
): string {
  if (currencies.length === 0) return defaultCurrency;

  // If locale is 'zh', prefer CNY
  if (locale === 'zh') {
    const cnyCurrency = currencies.find(
      (c) => c.currency.toLowerCase() === 'cny'
    );
    if (cnyCurrency) {
      return cnyCurrency.currency;
    }
  }

  // Otherwise return default currency
  return defaultCurrency;
}

export function Pricing({
  section,
  className,
  currentSubscription,
}: {
  section: PricingType;
  className?: string;
  currentSubscription?: Subscription;
}) {
  const locale = useLocale();
  const t = useTranslations('pages.pricing.messages');

  const {
    user,
    isShowPaymentModal,
    setIsShowSignModal,
    setIsShowPaymentModal,
    configs,
  } = useAppContext();

  const [group, setGroup] = useState(() => {
    // find current pricing item
    const currentItem = section.items?.find(
      (i) => i.product_id === currentSubscription?.productId
    );

    // First look for a group with is_featured set to true
    const featuredGroup = section.groups?.find((g) => g.is_featured);
    // If no featured group exists, fall back to the first group
    return (
      currentItem?.group || featuredGroup?.name || section.groups?.[0]?.name
    );
  });

  // current pricing item
  const [pricingItem, setPricingItem] = useState<PricingItem | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);

  // Currency state management for each item
  // Store selected currency and displayed item for each product_id
  const [itemCurrencies, setItemCurrencies] = useState<
    Record<string, { selectedCurrency: string; displayedItem: PricingItem }>
  >({});

  // Initialize currency states for all items
  useEffect(() => {
    if (section.items && section.items.length > 0) {
      const initialCurrencyStates: Record<
        string,
        { selectedCurrency: string; displayedItem: PricingItem }
      > = {};

      section.items.forEach((item) => {
        const currencies = getCurrenciesFromItem(item);
        const selectedCurrency = getInitialCurrency(
          currencies,
          locale,
          item.currency
        );

        // Create displayed item with selected currency
        const currencyData = currencies.find(
          (c) => c.currency.toLowerCase() === selectedCurrency.toLowerCase()
        );

        const displayedItem = currencyData
          ? {
              ...item,
              currency: currencyData.currency,
              amount: currencyData.amount,
              price: currencyData.price,
              original_price: currencyData.original_price,
              // Override with currency-specific payment settings if available
              payment_product_id:
                currencyData.payment_product_id || item.payment_product_id,
              payment_providers:
                currencyData.payment_providers || item.payment_providers,
            }
          : item;

        initialCurrencyStates[item.product_id] = {
          selectedCurrency,
          displayedItem,
        };
      });

      setItemCurrencies(initialCurrencyStates);
    }
  }, [section.items, locale]);

  // Handler for currency change
  const handleCurrencyChange = (productId: string, currency: string) => {
    const item = section.items?.find((i) => i.product_id === productId);
    if (!item) return;

    const currencies = getCurrenciesFromItem(item);
    const currencyData = currencies.find(
      (c) => c.currency.toLowerCase() === currency.toLowerCase()
    );

    if (currencyData) {
      const displayedItem = {
        ...item,
        currency: currencyData.currency,
        amount: currencyData.amount,
        price: currencyData.price,
        original_price: currencyData.original_price,
        // Override with currency-specific payment settings if available
        payment_product_id:
          currencyData.payment_product_id || item.payment_product_id,
        payment_providers:
          currencyData.payment_providers || item.payment_providers,
      };

      setItemCurrencies((prev) => ({
        ...prev,
        [productId]: {
          selectedCurrency: currency,
          displayedItem,
        },
      }));
    }
  };

  const handlePayment = async (item: PricingItem) => {
    if (!user) {
      setIsShowSignModal(true);
      return;
    }

    // Use displayed item with selected currency
    const displayedItem =
      itemCurrencies[item.product_id]?.displayedItem || item;

    if (configs.select_payment_enabled === 'true') {
      setPricingItem(displayedItem);
      setIsShowPaymentModal(true);
    } else {
      handleCheckout(displayedItem, configs.default_payment_provider);
    }
  };

  const getAffiliateMetadata = ({
    paymentProvider,
  }: {
    paymentProvider: string;
  }) => {
    const affiliateMetadata: Record<string, string> = {};

    // get Affonso referral
    if (
      configs.affonso_enabled === 'true' &&
      ['stripe', 'creem'].includes(paymentProvider)
    ) {
      const affonsoReferral = getCookie('affonso_referral') || '';
      affiliateMetadata.affonso_referral = affonsoReferral;
    }

    // get PromoteKit referral
    if (
      configs.promotekit_enabled === 'true' &&
      ['stripe'].includes(paymentProvider)
    ) {
      const promotekitReferral =
        typeof window !== 'undefined' && (window as any).promotekit_referral
          ? (window as any).promotekit_referral
          : getCookie('promotekit_referral') || '';
      affiliateMetadata.promotekit_referral = promotekitReferral;
    }

    return affiliateMetadata;
  };

  const handleCheckout = async (
    item: PricingItem,
    paymentProvider?: string
  ) => {
    try {
      if (!user) {
        setIsShowSignModal(true);
        return;
      }

      const affiliateMetadata = getAffiliateMetadata({
        paymentProvider: paymentProvider || '',
      });

      const params = {
        product_id: item.product_id,
        currency: item.currency,
        locale: locale || 'en',
        payment_provider: paymentProvider || '',
        metadata: affiliateMetadata,
      };

      setIsLoading(true);
      setProductId(item.product_id);

      const response = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (response.status === 401) {
        setIsLoading(false);
        setProductId(null);
        setPricingItem(null);
        setIsShowSignModal(true);
        return;
      }

      if (!response.ok) {
        throw new Error(`request failed with status ${response.status}`);
      }

      const { code, message, data } = await response.json();
      if (code !== 0) {
        throw new Error(message);
      }

      const { checkoutUrl } = data;
      if (!checkoutUrl) {
        throw new Error('checkout url not found');
      }

      window.location.href = checkoutUrl;
    } catch (e: any) {
      console.log('checkout failed: ', e);
      toast.error('checkout failed: ' + e.message);

      setIsLoading(false);
      setProductId(null);
    }
  };

  useEffect(() => {
    if (section.items) {
      const featuredItem = section.items.find((i) => i.is_featured);
      setProductId(featuredItem?.product_id || section.items[0]?.product_id);
      setIsLoading(false);
    }
  }, [section.items]);

  const items =
    section.items?.filter(
      (item) => !item.group || !group || item.group === group
    ) ?? [];
  const gridCols =
    items.length >= 4
      ? 'lg:grid-cols-4'
      : items.length === 3
        ? 'lg:grid-cols-3'
        : items.length === 2
          ? 'md:grid-cols-2'
          : '';

  return (
    <section
      id={section.id}
      className={cn('py-16 md:py-24', section.className, className)}
    >
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          {section.sr_only_title && (
            <h1 className="sr-only">{section.sr_only_title}</h1>
          )}
          <h2 className="break-words text-4xl leading-[0.95] font-display uppercase tracking-tight text-balance sm:text-5xl md:text-6xl">
            {section.title}
          </h2>
          {section.description && (
            <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base font-medium text-balance">
              {section.description}
            </p>
          )}
        </div>

        <div className="border-foreground mt-12 border-t-[3px]">
          {section.groups && section.groups.length > 1 && (
            <div className="mt-8 flex w-full justify-center">
              <Tabs value={group} onValueChange={setGroup} className="">
                <TabsList>
                  {section.groups.map((item, i) => {
                    return (
                      <TabsTrigger key={i} value={item.name || ''}>
                        {item.title}
                        {item.label && (
                          <Badge className="ml-2">{item.label}</Badge>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </Tabs>
            </div>
          )}

          <div
            className={cn(
              'grid grid-cols-1 gap-5 pt-10 md:gap-6',
              gridCols
            )}
          >
            {section.items?.map((item: PricingItem, idx) => {
              if (item.group && group && item.group !== group) {
                return null;
              }

              let isCurrentPlan = false;
              if (
                currentSubscription &&
                currentSubscription.productId === item.product_id
              ) {
                isCurrentPlan = true;
              }

              // Get currency state for this item
              const currencyState = itemCurrencies[item.product_id];
              const displayedItem = currencyState?.displayedItem || item;
              const selectedCurrency =
                currencyState?.selectedCurrency || item.currency;
              const currencies = getCurrenciesFromItem(item);

              return (
                <div
                  key={idx}
                  className="border-border bg-card relative flex flex-col border p-6 transition-colors hover:bg-muted/50 md:p-8"
                >
                  {/* header: name + save badge */}
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-bold tracking-[0.16em] uppercase">
                      {item.title}
                    </h3>
                    {item.label && (
                      <span className="border-accent text-accent shrink-0 border px-2.5 py-1 text-xs font-bold tracking-[0.08em] uppercase">
                        {item.label}
                      </span>
                    )}
                  </div>

                  {/* price */}
                  <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    {displayedItem.original_price && (
                      <span className="text-muted-foreground text-lg line-through">
                        {displayedItem.original_price}
                      </span>
                    )}
                    <span className="text-5xl leading-none font-display tracking-tight md:text-6xl">
                      {displayedItem.price}
                    </span>
                    {displayedItem.unit && (
                      <span className="text-muted-foreground text-sm font-bold tracking-wide uppercase">
                        {displayedItem.unit}
                      </span>
                    )}
                    {currencies.length > 1 && (
                      <Select
                        value={selectedCurrency}
                        onValueChange={(currency) =>
                          handleCurrencyChange(item.product_id, currency)
                        }
                      >
                        <SelectTrigger
                          size="sm"
                          className="h-6 min-w-[60px] px-2 text-xs"
                        >
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                        <SelectContent>
                          {currencies.map((currency) => (
                            <SelectItem
                              key={currency.currency}
                              value={currency.currency}
                              className="text-xs"
                            >
                              {currency.currency.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>

                  <hr className="border-border/50 mt-6" />

                  {/* credits */}
                  {typeof item.credits === 'number' && (
                    <div className="mt-6 flex items-baseline gap-2">
                      <span className="text-4xl leading-none font-display tracking-tight">
                        {item.credits.toLocaleString('en-US')}
                      </span>
                      <span className="text-sm font-bold">
                        {item.credits_label || 'credits'}
                      </span>
                    </div>
                  )}

                  {item.description && (
                    <p className="text-muted-foreground mt-2 text-sm">
                      {item.description}
                    </p>
                  )}

                  {/* features */}
                  {item.features && item.features.length > 0 && (
                    <ul className="mt-5 space-y-2.5">
                      {item.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2.5 text-sm font-semibold"
                        >
                          <span
                            className="bg-accent size-1.5 shrink-0"
                            aria-hidden
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  )}

                  {item.tip && (
                    <p className="text-muted-foreground mt-4 text-sm">
                      {item.tip}
                    </p>
                  )}

                  {/* cta pinned to card bottom */}
                  <div className="mt-auto pt-8">
                    {isCurrentPlan ? (
                      <button
                        type="button"
                        disabled
                        className="border-border text-muted-foreground flex h-12 w-full cursor-not-allowed items-center justify-between border px-5 text-sm font-bold tracking-wide uppercase"
                      >
                        <span>{t('current_plan')}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePayment(item)}
                        disabled={isLoading}
                        className="bg-foreground text-background hover:bg-primary hover:text-primary-foreground flex h-12 w-full items-center justify-between px-5 text-sm font-bold tracking-wide uppercase transition-colors disabled:opacity-60"
                      >
                        <span className="flex items-center gap-2">
                          {isLoading && item.product_id === productId ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            item.button?.icon && (
                              <SmartIcon
                                name={item.button.icon as string}
                                className="size-4"
                              />
                            )
                          )}
                          {item.button?.title || 'Get started'}
                        </span>
                        <ArrowUpRight className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <PaymentModal
        isLoading={isLoading}
        pricingItem={pricingItem}
        onCheckout={(item, paymentProvider) =>
          handleCheckout(item, paymentProvider)
        }
      />
    </section>
  );
}
