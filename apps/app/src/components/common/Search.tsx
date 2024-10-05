/* eslint-disable react-hooks/exhaustive-deps */
import Link from 'next/link';
import debounce from 'lodash/debounce';
import { toast } from 'react-toastify';
import { useRouter } from 'next/router';
import React, { useEffect, useState, useCallback } from 'react';
import {
  Combobox,
  ComboboxList,
  ComboboxInput,
  ComboboxOption,
  ComboboxPopover,
} from '@reach/combobox';

import { networkId } from '@/utils/config';
import ArrowDown from '../Icons/ArrowDown';
import { localFormat, shortenAddress, shortenHex } from '@/utils/libs';
import SearchIcon from '../Icons/SearchIcon';
import { useTranslations } from 'next-intl';
import { useIntlRouter, usePathname } from '@/i18n/routing';

export const SearchToast = () => {
  if (networkId === 'testnet') {
    return (
      <div>
        No results. Try on{' '}
        <Link href="https://nearblocks.io">
          <span className="text-green-500">Mainnet</span>
        </Link>
      </div>
    );
  }

  return (
    <div>
      No results. Try on{' '}
      <Link href="https://testnet.nearblocks.io">
        <span className="text-green-500">Testnet</span>
      </Link>
    </div>
  );
};

const Search = ({
  header = false,
  result = {} as any,
  redirectResult = {} as any,
}) => {
  const router = useRouter();
  const intlRouter = useIntlRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const [keyword, setKeyword] = useState('');
  const [filter, setFilter] = useState('all');

  const query = router?.query?.query;
  const q = typeof query === 'string' ? query.replace(/[\s,]/g, '') : '';

  const homeSearch = pathname === '/[locale]' || '/';

  const showResults =
    result?.blocks?.length > 0 ||
    result?.txns?.length > 0 ||
    result?.accounts?.length > 0 ||
    result?.receipts?.length > 0;

  const redirect = (route: any) => {
    switch (route?.type) {
      case 'block':
        return intlRouter.push(`/blocks/${route?.path}`);
      case 'txn':
        return intlRouter.push(`/txns/${route?.path}`);
      case 'receipt':
        return intlRouter.push(`/txns/${route?.path}`);
      case 'address':
        return intlRouter.push(`/address/${route?.path}`);
      default:
        return toast.error(SearchToast);
    }
  };

  useEffect(() => {
    if (q) {
      redirect(redirectResult);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, redirectResult]);

  useEffect(() => {
    if (filter && keyword) {
      const { query, locale, ...currentQuery } = router.query;
      const newQuery = {
        ...currentQuery,
        keyword: keyword,
        filter: filter,
      };
      // @ts-ignore: Unreachable code error
      intlRouter.push({
        pathname: pathname,
        query: newQuery,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, keyword]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSave = useCallback(
    debounce((nextValue) => setKeyword(nextValue), 500),
    [],
  );

  const handleChange = (event: any) => {
    const { value: nextValue } = event.target;
    debouncedSave(nextValue.replace(/[\s,]/g, ''));
  };

  const onFilter = (event: any) => setFilter(event.target.value);

  const onSelect = (item: any) => redirect(item);

  const onSubmit = async (event: any) => {
    event.preventDefault();

    const text = (
      document.getElementsByClassName('search')[0] as HTMLInputElement
    ).value;
    const qs = text.replace(/[\s,]/g, '');

    const { query, keyword, locale, ...currentQuery } = router.query;
    const newQuery = {
      ...currentQuery,
      query: qs,
      filter: filter,
    };

    // @ts-ignore: Unreachable code error
    return intlRouter.push({
      pathname: pathname,
      query: newQuery,
    });
  };

  return (
    <form
      className={`flex w-full ${header ? 'h-11' : 'h-12'}`}
      onSubmit={onSubmit}
    >
      <label className="relative hidden md:flex">
        <select
          className={`h-full block text-sm text-nearblue-600 dark:bg-black dark:text-neargray-10 ${
            homeSearch
              ? 'bg-gray-100 dark:bg-black-500 dark:text-neargray-10'
              : 'bg-blue-900/[0.05] dark:bg-black dark:text-neargray-10'
          }  pl-4 pr-9  cursor-pointer focus:outline-none appearance-none rounded-none rounded-l-lg border dark:border-black-200 dark:text-neargray-10`}
          value={filter}
          onChange={onFilter}
        >
          <option value="all">{t('search.filters.all')}</option>
          <option value="txns">{t('search.filters.txns')}</option>
          <option value="blocks">{t('search.filters.blocks')}</option>
          <option value="accounts">{t('search.filters.addresses')}</option>
        </select>
        <ArrowDown className="absolute right-3 top-3.5 w-4 h-4 fill-current text-nearblue-600 dark:text-neargray-10 pointer-events-none" />
      </label>

      <Combobox className="flex-grow">
        <ComboboxInput
          placeholder={t('search.placeholder')}
          className="search bg-white dark:bg-black-600 dark:text-neargray-10 w-full h-full text-sm px-4 py-3 outline-none dark:border-black-200 border-l border-t border-b md:border-l-0 rounded-l-lg rounded-r-none md:rounded-l-none"
          onChange={handleChange}
        />
        {showResults && (
          <ComboboxPopover className="z-50 dark:bg-black-600">
            <ComboboxList className="text-xs rounded-b-lg  bg-gray-50 py-2 shadow border dark:border-black-200 dark:bg-black-600">
              {result?.accounts?.length > 0 && (
                <>
                  <h3 className=" mx-2 my-2 px-2 py-2 text-sm bg-gray-100 dark:text-neargray-10 dark:bg-black-200 rounded">
                    {t('search.list.address')}
                  </h3>
                  {result.accounts.map((address: any) => (
                    <ComboboxOption
                      value={address.account_id}
                      className="mx-2 px-2 py-2 hover:bg-gray-100 dark:hover:bg-black-200 dark:text-neargray-10 cursor-pointer rounded hover:border-gray-500 truncate"
                      key={address.account_id}
                      onClick={() =>
                        onSelect({ type: 'address', path: address.account_id })
                      }
                    >
                      {shortenAddress(address.account_id)}
                    </ComboboxOption>
                  ))}
                </>
              )}
              {result?.txns?.length > 0 && (
                <>
                  <h3 className=" mx-2 my-2 px-2 py-2 text-sm bg-gray-100 dark:text-neargray-10 dark:bg-black-200 rounded">
                    {t('search.list.txns')}
                  </h3>
                  {result.txns.map((txn: any) => (
                    <ComboboxOption
                      value={txn.transaction_hash}
                      className="mx-2 px-2 py-2 hover:bg-gray-100 dark:hover:bg-black-200 dark:text-neargray-10 rounded cursor-pointer hover:border-gray-500 truncate"
                      key={txn.transaction_hash}
                      onClick={() =>
                        onSelect({ type: 'txn', path: txn.transaction_hash })
                      }
                    >
                      {shortenHex(txn.transaction_hash)}
                    </ComboboxOption>
                  ))}
                </>
              )}
              {result?.receipts?.length > 0 && (
                <>
                  <h3 className=" mx-2 my-2 px-2 py-2 text-sm bg-gray-100 dark:text-neargray-10 dark:bg-black-200 rounded">
                    Receipts
                  </h3>
                  {result.receipts.map((receipt: any) => (
                    <ComboboxOption
                      value={receipt.receipt_id}
                      className="mx-2 px-2 py-2 hover:bg-gray-100 dark:hover:bg-black-200 dark:text-neargray-10 rounded cursor-pointer hover:border-gray-500 truncate"
                      key={receipt.receipt_id}
                      onClick={() =>
                        onSelect({
                          type: 'receipt',
                          path: receipt.originated_from_transaction_hash,
                        })
                      }
                    >
                      {shortenHex(receipt.receipt_id)}
                    </ComboboxOption>
                  ))}
                </>
              )}
              {result?.blocks?.length > 0 && (
                <>
                  <h3 className=" mx-2 my-2 px-2 py-2 text-sm bg-gray-100 dark:text-neargray-10 dark:bg-black-200 rounded">
                    {t('search.list.blocks')}
                  </h3>
                  {result.blocks.map((block: any) => (
                    <ComboboxOption
                      value={block.block_hash}
                      className="mx-2 px-2 py-2 hover:bg-gray-100 dark:hover:bg-black-200 dark:text-neargray-10 rounded cursor-pointer hover:border-gray-500 truncate"
                      key={block.block_hash}
                      onClick={() =>
                        onSelect({ type: 'block', path: block.block_hash })
                      }
                    >
                      #{localFormat(block.block_height)} (0x
                      {shortenHex(block.block_hash)})
                    </ComboboxOption>
                  ))}
                </>
              )}
            </ComboboxList>
          </ComboboxPopover>
        )}
      </Combobox>
      <button
        type="submit"
        className={`${
          homeSearch
            ? 'bg-gray-100 dark:bg-black-500'
            : 'bg-blue-900/[0.05] dark:bg-black-600'
        } rounded-r-lg px-5 outline-none focus:outline-none border dark:border-black-200`}
      >
        <SearchIcon className="text-gray-700 dark:text-gray-100 fill-current " />
      </button>
    </form>
  );
};

export default Search;
