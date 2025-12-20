const formatPrice = (price) => {
  return new Intl.NumberFormat("en-US").format(parseFloat(price));
};

export default formatPrice;
