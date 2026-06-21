import { ProductDetail } from "@/components/product-detail";
import { getPublicProductDetail } from "@/services/public-catalog-service";

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const detail = await getPublicProductDetail(id);
  return (
    <ProductDetail
      productId={id}
      returnTo={from}
      initialProduct={detail.product}
      initialProducts={detail.products}
      initialCatalogError={detail.error}
    />
  );
}
