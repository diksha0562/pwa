import { useContext } from 'react';

/**
 * Load localization messages from `dictionary` and return them as object for the selected `lang`.
 * This is hook version of HOC `withLocale`.
 * @param {object} dictionary The dictionary.
 * @returns {Array.<object>} Tuple. First element (and the only element) is localization messages object. It
 * is identical to `locale` returned by HOC `withLocale`.
 * @example
 * import useMessages from '@hooks/locale/useMessages';
 * import dictionary from '@routes/old/Cart/locales';
 *
 * const YourComponent = props => {
 *   const [m] = useMessages(dictionary);
 *
 *   return (
 *     <div>{m.title}</div>
 *     <div>{m.cartAtc}</div>
 *   )
 * }
 */
export default function useMessages(LocaleContext: any, dictionary: any): any[] {
  const { lang } = useContext(LocaleContext);

  // Why returning tuple? To make API similar to `useState` so if we need setter function, we can add
  // it as second element.
  return [dictionary[lang]];
}
