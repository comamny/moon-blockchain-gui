import { createApi } from '@reduxjs/toolkit/query/react';
import moonLazyBaseQuery from './moonLazyBaseQuery';

export const baseQuery = moonLazyBaseQuery({});

export default createApi({
  reducerPath: 'moonApi',
  baseQuery,
  endpoints: () => ({}),
});
