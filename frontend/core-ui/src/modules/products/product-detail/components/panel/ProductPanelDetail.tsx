import { ScrollArea } from 'erxes-ui';
import { useTranslation } from 'react-i18next';
import { PanelDescriptionField, usePanelExpanded } from 'ui-modules';
import {
  ProductPanelFields,
  TProductPanelFieldsProps,
} from './ProductPanelFields';

// The Detail tab: the fields, then the description. On the product's page
// the fields stand alone, as the description has its own tab there.
export const ProductPanelDetail = (props: TProductPanelFieldsProps) => {
  const { product, save } = props;
  const { t } = useTranslation('product', { keyPrefix: 'detail' });
  const expanded = usePanelExpanded();

  // Radix sizes its content as a table, which lets wide values push past the
  // panel; a block lets each value shrink and truncate instead.
  return (
    <ScrollArea className="flex-1 min-h-0" viewportClassName="[&>div]:block!">
      <div className="flex flex-col gap-5 p-3">
        <ProductPanelFields {...props} />
        {!expanded && (
          <PanelDescriptionField
            key={product._id}
            label={t('description')}
            value={product.description || ''}
            scope={`side-panel-product.${product._id}.description`}
            onSave={(description) => save({ description })}
          />
        )}
      </div>
    </ScrollArea>
  );
};
