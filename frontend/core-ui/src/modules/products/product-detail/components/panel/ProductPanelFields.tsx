import {
  IconBuilding,
  IconCategory,
  IconClock,
  IconCoin,
  IconCurrencyDollar,
  IconHash,
  IconHourglass,
  IconLabel,
  IconListDetails,
  IconPackage,
  IconRuler,
  IconShoppingCart,
  IconStack2,
  IconTag,
  IconTags,
  IconWeight,
} from '@tabler/icons-react';
import {
  cn,
  CurrencyCode,
  CurrencyField,
  NumberField,
  PopoverScoped,
  RecordTableInlineCell,
  Select,
  TextField,
} from 'erxes-ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PANEL_TEXT_FIELD_CLASS_NAME,
  PanelField,
  PanelFieldTrigger,
  SelectBrand,
  SelectCategory,
  SelectCompany,
  TagsSelect,
} from 'ui-modules';
import {
  PRODUCT_DURATION_TYPES,
  PRODUCT_TYPES,
} from 'ui-modules/modules/products/constants/productTypes';
import { ContactDetailSection } from '@/side-panel/components/details/ContactDetailSection';
import { ProductConditionsCell } from '@/products/components/ProductConditionsCell';
import { TProductPatch } from '@/products/product-detail/hooks/useProductPanelSave';
import { ProductDetail } from '@/products/product-detail/types/detailTypes';
import { ProductNameField } from './ProductNameField';
import { ProductSubUomsField } from './ProductSubUomsField';
import { ProductUomField } from './ProductUomField';

const SCOPE = 'side-panel-product';

// Plain selects drawn like the panel's other cells: the chevron shows on
// hover, as the other cells have none.
const PANEL_SELECT_TRIGGER_CLASS_NAME =
  'h-7 rounded-sm px-2 shadow-none hover:bg-accent [&>svg]:opacity-0 hover:[&>svg]:opacity-100 focus-visible:[&>svg]:opacity-100';

type TDurationPatch = Pick<TProductPatch, 'duration' | 'durationType'>;

export type TProductPanelFieldsProps = {
  product: ProductDetail & { _id: string };
  // Resolves the saved product, or `null` when it was not saved.
  save: (patch: TProductPatch) => Promise<ProductDetail | null>;
};

const toSingleId = (value: string[] | string) =>
  (Array.isArray(value) ? value[0] : value) || '';

// What to do with an empty cell, in place of its value. For cells that draw
// nothing when empty; the others take it as their own placeholder.
const EmptyHint = ({ children }: { children: string }) => (
  <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-xs text-accent-foreground">
    {children}
  </span>
);

// The supplier, a company: the company picker as a panel cell.
const ProductVendorField = ({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (vendorId: string) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <SelectCompany.Provider
      value={value}
      onValueChange={(next) => {
        setOpen(false);
        const vendorId = toSingleId(next);
        if (vendorId !== value) onChange(vendorId);
      }}
    >
      <PopoverScoped
        scope={`${SCOPE}.vendor`}
        open={open}
        onOpenChange={setOpen}
      >
        <PanelFieldTrigger>
          <SelectCompany.Value placeholder={placeholder} />
        </PanelFieldTrigger>
        <RecordTableInlineCell.Content>
          <SelectCompany.Content />
        </RecordTableInlineCell.Content>
      </PopoverScoped>
    </SelectCompany.Provider>
  );
};

const ProductCurrencyField = ({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (currency: string) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <PopoverScoped
      scope={`${SCOPE}.currency`}
      open={open}
      onOpenChange={setOpen}
    >
      <PanelFieldTrigger>
        {value || <span className="text-accent-foreground">{placeholder}</span>}
      </PanelFieldTrigger>
      <RecordTableInlineCell.Content>
        <CurrencyField.SelectCurrencyCommand
          value={(value as CurrencyCode) || undefined}
          focusOnMount
          onSelect={(currency) => {
            setOpen(false);
            if (currency !== value) onChange(currency);
          }}
        />
      </RecordTableInlineCell.Content>
    </PopoverScoped>
  );
};

/**
 * The product's fields as record table cells: click a value to edit it, and
 * it saves on its own. A unique product needs a duration, so choosing that
 * type waits for one before saving.
 */
export const ProductPanelFields = ({
  product,
  save,
}: TProductPanelFieldsProps) => {
  const { t } = useTranslation('product', { keyPrefix: 'detail' });
  const [uniqueDraft, setUniqueDraft] = useState<TDurationPatch | null>(null);
  const isUnique = product.type === 'unique' || !!uniqueDraft;
  const duration = uniqueDraft?.duration ?? product.duration;
  const durationType = uniqueDraft?.durationType ?? product.durationType;

  const changeType = (type: string) => {
    if (type === 'unique' && (!product.duration || !product.durationType)) {
      setUniqueDraft({});
      return;
    }
    setUniqueDraft(null);
    if (type !== product.type) save({ type });
  };

  const changeDuration = (patch: TDurationPatch) => {
    if (!uniqueDraft) {
      save(patch);
      return;
    }
    const next = { ...uniqueDraft, ...patch };
    setUniqueDraft(next);
    if (next.duration && next.durationType) {
      save({ type: 'unique', ...next }).then(
        (saved) => saved && setUniqueDraft(null),
      );
    }
  };

  return (
    <div className="flex min-w-0 flex-col">
      <ContactDetailSection title={t('general')} nested>
        <PanelField icon={IconPackage} label={t('name')} cell={false}>
          <ProductNameField
            value={product.name || ''}
            placeholder={t('enter-name')}
            onSave={(name) => save({ name })}
          />
        </PanelField>
        <PanelField icon={IconCategory} label={t('category')}>
          <SelectCategory.InlineCell
            scope={`${SCOPE}.category`}
            value={product.categoryId || ''}
            placeholder={t('choose-category', 'Choose category')}
            onValueChange={(value) => {
              const categoryId = toSingleId(value);
              if (categoryId && categoryId !== product.categoryId) {
                save({ categoryId });
              }
            }}
          />
        </PanelField>
        <PanelField icon={IconHash} label={t('code')}>
          <TextField
            scope={`${SCOPE}.code`}
            value={product.code || ''}
            placeholder={t('enter-code', 'Enter code')}
            disabled={!!product.similarityId}
            className={cn(
              PANEL_TEXT_FIELD_CLASS_NAME,
              !product.code && 'text-accent-foreground',
            )}
            onSave={(code) => code.trim() && save({ code: code.trim() })}
          />
        </PanelField>
        <PanelField icon={IconShoppingCart} label={t('type')}>
          <Select
            value={uniqueDraft ? 'unique' : product.type || ''}
            onValueChange={changeType}
          >
            <Select.Trigger className={PANEL_SELECT_TRIGGER_CLASS_NAME}>
              <Select.Value placeholder={t('select-type', 'Select type')} />
            </Select.Trigger>
            <Select.Content align="start">
              {PRODUCT_TYPES.map((type) => (
                <Select.Item key={type.value} value={type.value}>
                  {type.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </PanelField>
        <PanelField icon={IconLabel} label={t('short-name')}>
          <TextField
            scope={`${SCOPE}.shortName`}
            value={product.shortName || ''}
            placeholder={t('enter-short-name', 'Enter short name')}
            className={cn(
              PANEL_TEXT_FIELD_CLASS_NAME,
              !product.shortName && 'text-accent-foreground',
            )}
            onSave={(shortName) => save({ shortName })}
          />
        </PanelField>
        <PanelField icon={IconTags} label={t('tags')} cell={false}>
          <TagsSelect.InlineCell
            type="core:product"
            mode="multiple"
            scope={`${SCOPE}.tags`}
            value={product.tagIds || []}
            targetIds={[product._id]}
            options={(tagIds) => ({
              update: (cache) => {
                cache.modify({
                  id: cache.identify({
                    __typename: 'Product',
                    _id: product._id,
                  }),
                  fields: { tagIds: () => tagIds },
                  optimistic: true,
                });
              },
            })}
          />
          {!product.tagIds?.length && (
            <EmptyHint>{t('add-tags', 'Add tags')}</EmptyHint>
          )}
        </PanelField>
      </ContactDetailSection>
      <ContactDetailSection title={t('pricing', 'Pricing')} nested>
        <PanelField icon={IconCurrencyDollar} label={t('unit-price')}>
          <NumberField
            scope={`${SCOPE}.unitPrice`}
            value={product.unitPrice ?? 0}
            className={PANEL_TEXT_FIELD_CLASS_NAME}
            onSave={(unitPrice) => save({ unitPrice })}
          />
        </PanelField>
        <PanelField icon={IconCoin} label={t('currency')}>
          <ProductCurrencyField
            value={product.currency || ''}
            placeholder={t('select-currency', 'Select currency')}
            onChange={(currency) => save({ currency })}
          />
        </PanelField>
      </ContactDetailSection>
      <ContactDetailSection title={t('measurement', 'Measurement')} nested>
        <PanelField icon={IconRuler} label={t('uom')}>
          <ProductUomField
            scope={`${SCOPE}.uom`}
            value={typeof product.uom === 'string' ? product.uom : ''}
            placeholder={t('select-uom', 'Select UOM')}
            onChange={(uom) => save({ uom })}
          />
        </PanelField>
        <div className="flex min-w-0 flex-col gap-1 py-1">
          <span className="flex items-center gap-1.5 px-0 text-xs font-medium text-accent-foreground">
            <IconStack2 className="size-3.5 shrink-0" aria-hidden="true" />
            {t('sub-uom')}
          </span>
          <ProductSubUomsField
            scope={`${SCOPE}.subUoms`}
            subUoms={product.subUoms}
            onChange={(subUoms) => save({ subUoms })}
          />
        </div>
        <PanelField icon={IconWeight} label={t('weight')}>
          <NumberField
            scope={`${SCOPE}.weight`}
            value={product.weight ?? 0}
            formatValue={(weight) =>
              product.weight == null ? '' : weight.toLocaleString()
            }
            className={PANEL_TEXT_FIELD_CLASS_NAME}
            onSave={(weight) => save({ weight })}
          />
          {product.weight == null && (
            <EmptyHint>{t('enter-weight', 'Enter weight')}</EmptyHint>
          )}
        </PanelField>
        {isUnique && (
          <>
            <PanelField icon={IconHourglass} label={t('duration')}>
              <NumberField
                scope={`${SCOPE}.duration`}
                value={duration ?? 0}
                formatValue={(value) => (value ? value.toLocaleString() : '')}
                className={PANEL_TEXT_FIELD_CLASS_NAME}
                onSave={(value) => changeDuration({ duration: value })}
              />
              {!duration && (
                <EmptyHint>{t('enter-duration', 'Enter duration')}</EmptyHint>
              )}
            </PanelField>
            <PanelField icon={IconClock} label={t('duration-type')}>
              <Select
                value={durationType || ''}
                onValueChange={(value) =>
                  changeDuration({
                    durationType: value as TDurationPatch['durationType'],
                  })
                }
              >
                <Select.Trigger className={PANEL_SELECT_TRIGGER_CLASS_NAME}>
                  <Select.Value placeholder={t('select-duration-type')} />
                </Select.Trigger>
                <Select.Content align="start">
                  {PRODUCT_DURATION_TYPES.map((type) => (
                    <Select.Item key={type.value} value={type.value}>
                      {type.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </PanelField>
            {uniqueDraft && (
              <p className="px-1 text-xs text-muted-foreground">
                {t(
                  'unique-needs-duration',
                  'Set a duration and its type to make this product unique.',
                )}
              </p>
            )}
          </>
        )}
      </ContactDetailSection>
      <ContactDetailSection title={t('more-info')} nested>
        <PanelField icon={IconTag} label={t('brand')}>
          <SelectBrand.InlineCell
            mode="multiple"
            scope={`${SCOPE}.brands`}
            value={product.scopeBrandIds || []}
            onValueChange={(value) =>
              save({ scopeBrandIds: Array.isArray(value) ? value : [value] })
            }
          />
          {!product.scopeBrandIds?.length && (
            <EmptyHint>{t('select-brands', 'Select brands')}</EmptyHint>
          )}
        </PanelField>
        <PanelField icon={IconBuilding} label={t('vendor')}>
          <ProductVendorField
            value={product.vendorId || ''}
            placeholder={t('select-vendor', 'Select vendor')}
            onChange={(vendorId) => save({ vendorId })}
          />
        </PanelField>
        <PanelField icon={IconListDetails} label={t('conditions')}>
          <ProductConditionsCell
            productId={product._id}
            conditionCodes={product.conditionCodes || []}
          />
          {!product.conditionCodes?.length && (
            <EmptyHint>{t('select-conditions', 'Select conditions')}</EmptyHint>
          )}
        </PanelField>
      </ContactDetailSection>
    </div>
  );
};
