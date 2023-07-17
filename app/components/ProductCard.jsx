import clsx from 'clsx';
import { flattenConnection, Image, Money, useMoney } from '@shopify/hydrogen';
import { Text, Link, AddToCartButton, Heading, Input } from '~/components';
import { isDiscounted, isNewArrival } from '~/lib/utils';
import { getProductPlaceholder } from '~/lib/placeholders';
import { useLoaderData, useNavigation, useSearchParams } from '@remix-run/react';
import { Listbox } from '@headlessui/react';
import { useMemo, useState } from 'react';

export function ProductCard({
  product,
  label,
  className,
  loading,
  onClick,
  quickAdd,
}) {
  let cardLabel;
  const { location } = useNavigation();
  const [currentSearchParams] = useSearchParams();
  const productData = useLoaderData();
  // console.log(product)
  const cardProduct = product?.variants ? product : getProductPlaceholder();
  if (!cardProduct?.variants?.nodes?.length) return null;

  const allVariants = flattenConnection(cardProduct?.variants);

  if (!allVariants?.length) return null;
  
  const firstVariant = allVariants[0];
  

  const [selectedVariant, setSelectedVariant] = useState(firstVariant);

  if (!firstVariant) return null;
  const { price, compareAtPrice } = selectedVariant;

  if (label) {
    cardLabel = label;
  } else if (isDiscounted(price, compareAtPrice)) {
    cardLabel = 'Sale';
  } else if (isNewArrival(product?.publishedAt)) {
    cardLabel = 'New';
  }

  const productAnalytics = {
    productGid: product?.id,
    variantGid: selectedVariant?.id,
    name: product?.title,
    variantName: selectedVariant?.title,
    brand: product?.vendor,
    price: selectedVariant?.price?.amount,
    quantity: 1,
  };


  const handleSizeChange = (selectedSize) => {
    const updatedVariant = allVariants?.find(
      (variant) => variant.selectedOptions[0].value === selectedSize
    );
    setSelectedVariant(updatedVariant);
  };

  const handleColorChange = (selectedColor) => {
    const updatedVariant = allVariants?.find(
      (variant) => variant.selectedOptions[1].value === selectedColor
    );
    setSelectedVariant(updatedVariant);
  };

  const sizes = [];
  const colors = [];

  return (
    <div className="flex flex-col gap-2">
      <Link
        onClick={onClick}
        to={`/products/${product.handle}`}
        prefetch="intent"
      >
        <div className={clsx('grid gap-4', className)}>
          <div className="card-image aspect-[4/5] bg-primary/5">
            {selectedVariant?.image && (
              <Image
                className="object-cover w-full fadeIn"
                sizes="(min-width: 64em) 25vw, (min-width: 48em) 30vw, 45vw"
                aspectRatio="4/5"
                data={selectedVariant?.image}
                alt={
                  selectedVariant.image.altText ||
                  `Picture of ${product.title}`
                }
                loading={loading}
              />
            )}
            <Text
              as="label"
              size="fine"
              className="absolute top-0 right-0 m-4 text-right text-notice"
            >
              {cardLabel}
            </Text>
          </div>
          <div className="grid gap-1">
            <Text
              className="w-full overflow-hidden whitespace-nowrap text-ellipsis "
              as="h3"
            >
              {product.title}
            </Text>
            <div className="flex gap-4">
              <Text className="flex gap-4">
                <Money withoutTrailingZeros data={price} />
                {isDiscounted(price, compareAtPrice) && (
                  <CompareAtPrice
                    className={'opacity-50'}
                    data={compareAtPrice}
                  />
                )}
              </Text>
            </div>
          </div>
        </div>
      </Link>
      {product?.variants?.nodes.map((option) => {
        return option?.selectedOptions?.map((optionValue) => {
          if (
            optionValue?.name === 'Size' &&
            !sizes.includes(optionValue?.value)
          ) {
            sizes.push(optionValue?.value);
          }
          if (
            optionValue?.name === 'Color' &&
            !colors.includes(optionValue?.value)
          ) {
            colors.push(optionValue?.value);
          }
        });
      })}
      <div className="flex flex-col flex-wrap mb-4 gap-y-2 last:mb-0">
        <Heading as="legend" size="lead" className="min-w-[4rem]">
          Size:
        </Heading>
        {sizes.map((sItem) => (
          <div key={sItem}>
            <input
              type="radio"
              id={sItem}
              name="size"
              value={sItem}
              checked={selectedVariant.selectedOptions[0].value === sItem}
              onChange={() => handleSizeChange(sItem)}
            />
            <label htmlFor={sItem}>{sItem}</label>
          </div>
        ))}
        <Heading as="legend" size="lead" className="min-w-[4rem]">
          Color:
        </Heading>
        {colors.map((cItem) => (
          <div key={cItem}>
            <input
              type="radio"
              id={cItem}
              name="color"
              value={cItem}
              checked={selectedVariant.selectedOptions[1].value === cItem}
              onChange={() => handleColorChange(cItem)}
            />
            <label htmlFor={cItem}>{cItem}</label>
          </div>
        ))}
      </div>

      <AddToCartButton
        lines={[
          {
            quantity: 1,
            merchandiseId: selectedVariant.id,
          },
        ]}
        variant="secondary"
        className="mt-2"
        analytics={{
          products: [productAnalytics],
          totalValue: parseFloat(productAnalytics.price),
        }}
      >
        <Text as="span" className="flex items-center justify-center gap-2">
          Add to Cart
        </Text>
      </AddToCartButton>
    </div>
  );
}

function CompareAtPrice({ data, className }) {
  const { currencyNarrowSymbol, withoutTrailingZerosAndCurrency } = useMoney(
    data
  );

  const styles = clsx('strike', className);

  return (
    <span className={styles}>
      {currencyNarrowSymbol}
      {withoutTrailingZerosAndCurrency}
    </span>
  );
}
