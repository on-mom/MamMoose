import { useEffect, useRef } from 'react';

/** 항상 최신 콜백을 debounce 실행. cleanup 시 pending 취소. */
export function useDebounced<A extends unknown[]>(fn: (...args: A) => void, ms = 1000) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const timer = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => () => clearTimeout(timer.current), []);
  return (...args: A) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fnRef.current(...args), ms);
  };
}
