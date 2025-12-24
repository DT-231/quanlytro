import axios from "axios";

const request = axios.create({
  baseURL: "/api/address",
  // baseURL: "https://vn-public-apis.fpo.vn/",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
});

request.interceptors.response.use(
  function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response.data;
  },
  function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    // Do something with response error
    return Promise.reject(error);
  }
);

const getCity = () => {
  // return request.get(`/provinces/getAll?limit=-1`);
  return request.get(`/province?mode=1`);
};

const getWard = (province_id) => {
  // return request.get(
  //   `/districts/getByProvince?provinceCode=${province_id}&limit=-1`
  // );
  return request.get(`/district?provinceId=${province_id}`);
};

export { getCity, getWard };
