// Simple loading manager to track active HTTP requests and notify listeners
let count = 0;
const listeners = new Set();

export function onChange(cb) {
  listeners.add(cb);
  cb(count);
  return () => listeners.delete(cb);
}

function notify() {
  listeners.forEach((cb) => cb(count));
}

export function inc() {
  count += 1;
  notify();
}

export function dec() {
  count -= 1;
  if (count < 0) count = 0;
  notify();
}

export function attachAxios(axiosInstance) {
  if (!axiosInstance || !axiosInstance.interceptors) return;

  axiosInstance.interceptors.request.use(
    (cfg) => {
      inc();
      return cfg;
    },
    (err) => {
      dec();
      return Promise.reject(err);
    }
  );

  axiosInstance.interceptors.response.use(
    (res) => {
      dec();
      return res;
    },
    (err) => {
      dec();
      return Promise.reject(err);
    }
  );
}

export default { onChange, inc, dec, attachAxios };
