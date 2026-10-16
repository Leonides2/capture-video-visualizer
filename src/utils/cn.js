/** Une clases CSS ignorando valores falsy: cn("a", cond && "b"). */
export const cn = (...classes) => classes.filter(Boolean).join(" ");
