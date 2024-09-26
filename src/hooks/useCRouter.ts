import { useRouter as useLRouter } from 'next/compat/router';
import { Url } from 'next/dist/shared/lib/router/router';
interface TransitionOptions {
  shallow?: boolean;
  locale?: string | false;
  scroll?: boolean;
  unstable_skipClientCache?: boolean;
}
const RoutingFunc = (url: Url, as?: Url, options?: TransitionOptions) => {};
export const useRouter = () => {
  const router = useLRouter();
  console.log(router);
  const push =
    router?.push || ((url: Url, as?: Url, options?: TransitionOptions) => {});
  return {
    push: push,
    pathname: router?.pathname || '',
    query: router?.query || {},
    reload: router?.reload || (() => {}),
    replace: router?.replace || RoutingFunc,
  };
};
