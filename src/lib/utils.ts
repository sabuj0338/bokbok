
export const formatViews = (views: number) => {
  return new Intl.NumberFormat("en-US").format(views);
};
