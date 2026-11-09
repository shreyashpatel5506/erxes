import { Button, Form, ScrollArea } from 'erxes-ui';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  EMPTY_PRODUCT_FORM_VALUES,
  ProductFormValues,
} from '@/products/constants/ProductFormSchema';
import { ProductDetailBarcode } from '@/products/product-detail/components/ProductDetailBarcode';
import { getProductFormDefaultValues } from '@/products/product-detail/utils/productFormValues';
import { TProductPanelFieldsProps } from './ProductPanelFields';

const BARCODE_FIELDS = ['barcodes', 'variants', 'barcodeDescription'] as const;

type TBarcodeValues = Pick<ProductFormValues, (typeof BARCODE_FIELDS)[number]>;

const pickBarcodes = (values: ProductFormValues): TBarcodeValues => ({
  barcodes: values.barcodes,
  variants: values.variants,
  barcodeDescription: values.barcodeDescription,
});

/**
 * The Barcodes tab. Barcodes are edited a row at a time (a code, then its
 * variant's name), so they save together from the bar shown while they
 * differ from the product.
 */
export const ProductPanelInventory = ({
  product,
  save,
}: TProductPanelFieldsProps) => {
  const { t } = useTranslation('product', { keyPrefix: 'detail' });
  const defaults = useMemo(
    () => getProductFormDefaultValues(product) ?? EMPTY_PRODUCT_FORM_VALUES,
    [product],
  );
  const form = useForm<ProductFormValues>({ defaultValues: defaults });
  const [saving, setSaving] = useState(false);
  const [barcodes, variants, barcodeDescription] = useWatch({
    control: form.control,
    name: BARCODE_FIELDS,
  });
  const changed =
    JSON.stringify({ barcodes, variants, barcodeDescription }) !==
    JSON.stringify(pickBarcodes(defaults));

  // Read when the product changes, not a reason to reset on its own.
  const keep = useRef(changed);
  keep.current = changed;

  // A newly loaded product replaces what is shown, unless it was edited.
  useEffect(() => {
    if (!keep.current) form.reset(defaults);
  }, [defaults, form]);

  const handleSave = async () => {
    setSaving(true);
    const savedProduct = await save(pickBarcodes(form.getValues()));
    setSaving(false);
    // As saved: the server tidies barcodes.
    if (savedProduct) {
      form.reset({
        ...form.getValues(),
        ...pickBarcodes(
          getProductFormDefaultValues(savedProduct) ??
            EMPTY_PRODUCT_FORM_VALUES,
        ),
      });
    }
  };

  return (
    <Form {...form}>
      <div className="flex flex-1 min-h-0 flex-col">
        <ScrollArea
          className="flex-1 min-h-0"
          viewportClassName="[&>div]:block!"
        >
          <ProductDetailBarcode productDetail={product} />
        </ScrollArea>
        {changed && (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t px-3 py-2">
            <span className="mr-auto text-xs text-muted-foreground">
              {t('unsaved-changes', 'Unsaved changes')}
            </span>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => form.reset(defaults)}
            >
              {t('cancel')}
            </Button>
            <Button type="button" disabled={saving} onClick={handleSave}>
              {saving ? t('saving') : t('save')}
            </Button>
          </div>
        )}
      </div>
    </Form>
  );
};
