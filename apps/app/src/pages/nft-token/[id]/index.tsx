import Head from 'next/head';
import { appUrl } from '@/utils/config';
import { useRouter } from 'next/router';
import { ReactElement, useEffect, useState } from 'react';
import Layout from '@/components/Layouts';
import { env } from 'next-runtime-env';
import Overview from '@/components/Tokens/NFT/Overview';
import fetcher from '@/utils/fetcher';
import queryString from 'qs';
import { GetServerSideProps, InferGetServerSidePropsType } from 'next';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import classNames from 'classnames';
import Transfers from '@/components/Tokens/NFT/Transfers';
import Holders from '@/components/Tokens/NFT/Holders';
import Inventory from '@/components/Tokens/NFT/Inventory';
import { VmComponent } from '@/components/vm/VmComponent';
import Comment from '@/components/skeleton/common/Comment';
import { useBosComponents } from '@/hooks/useBosComponents';
import { useAuthStore } from '@/stores/auth';

const network = env('NEXT_PUBLIC_NETWORK_ID');
const ogUrl = env('NEXT_PUBLIC_OG_URL');

const tabs = ['transfers', 'holders', 'inventory', 'comments'];

export const getServerSideProps: GetServerSideProps<{
  tokenDetails: any;
  transfersDetails: any;
  holdersDetails: any;
  syncDetails: any;
  data: any;
  dataCount: any;
  error: boolean;
  tab: string;
  statsDetails: any;
  latestBlocks: any;
}> = async (context) => {
  const {
    query: { id = '', tab = 'transfers', ...query },
  }: { query: { id?: string; tab?: string } & Record<string, any> } = context;

  const tabApiUrls: Record<
    string,
    { api: string; count?: string; queryModifier?: () => void }
  > = {
    transfers: { api: `nfts/${id}/txns` },
    holders: { api: `nfts/${id}/holders` },
    inventory: {
      api: `nfts/${id}/tokens`,
      count: `nfts/${id}/tokens/count`,
      queryModifier: () => {
        query.per_page = '24';
      },
    },
    comments: { api: `` },
  };

  const commonApiUrls = {
    stats: 'stats',
    token: id && `nfts/${id}`,
    sync: 'sync/status',
    latestBlocks: `blocks/latest?limit=1`,
    transfersCount: id && `nfts/${id}/txns/count`,
    holdersCount: id && `nfts/${id}/holders/count`,
  };

  const apiUrls = tabApiUrls[tab as string];
  if (!apiUrls) {
    return { notFound: true };
  }

  apiUrls.queryModifier?.();

  const fetchData = async (url: string | undefined) =>
    url ? await fetcher(url) : null;

  try {
    // Fetch common data
    const [
      statsResult,
      tokenResult,
      syncResult,
      latestBlocksResult,
      transfersResult,
      holdersResult,
    ] = await Promise.allSettled([
      fetchData(commonApiUrls.stats),
      fetchData(commonApiUrls.token),
      fetchData(commonApiUrls.sync),
      fetchData(commonApiUrls.latestBlocks),
      fetchData(commonApiUrls.transfersCount),
      fetchData(commonApiUrls.holdersCount),
    ]);

    let dataResult = null;
    let dataCountResult = null;

    if (tab !== 'comments') {
      // Fetch tab-specific data
      const tabApi = tabApiUrls[tab as string];
      const fetchUrl = `${tabApi.api}${
        query ? `?${queryString.stringify(query)}` : ''
      }`;
      const countUrl =
        tabApi.count &&
        `${tabApi.count}${query ? `?${queryString.stringify(query)}` : ''}`;

      [dataResult, dataCountResult] = await Promise.allSettled([
        fetchData(fetchUrl),
        fetchData(countUrl),
      ]);
    }

    const getResult = (result: PromiseSettledResult<any>) =>
      result.status === 'fulfilled' ? result.value : null;

    return {
      props: {
        tokenDetails: getResult(tokenResult),
        transfersDetails: getResult(transfersResult),
        holdersDetails: getResult(holdersResult),
        syncDetails: getResult(syncResult),
        data: dataResult && getResult(dataResult),
        dataCount: dataCountResult && getResult(dataCountResult),
        error: dataResult ? false : true,
        tab: tab as string,
        statsDetails: getResult(statsResult),
        latestBlocks: getResult(latestBlocksResult),
      },
    };
  } catch (error) {
    console.error('Error fetching data:', error);
    return {
      props: {
        tokenDetails: null,
        transfersDetails: null,
        holdersDetails: null,
        syncDetails: null,
        data: null,
        dataCount: null,
        error: true,
        tab: 'transfers',
        statsDetails: null,
        latestBlocks: null,
      },
    };
  }
};

const NFToken = ({
  tokenDetails,
  transfersDetails,
  holdersDetails,
  syncDetails,
  data,
  dataCount,
  error,
  tab,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const { id } = router.query;
  const [tabIndex, setTabIndex] = useState(0);
  const components = useBosComponents();

  const token = tokenDetails?.contracts?.[0];
  const transfers = transfersDetails?.txns?.[0]?.count;
  const holders = holdersDetails?.holders?.[0]?.count;

  const txns = data?.txns || [];
  const txnCursor = data?.cursor;

  const holder = data?.holders || [];
  const status = syncDetails?.status?.aggregates.nft_holders || {
    height: '0',
    sync: true,
    timestamp: '',
  };

  const requestSignInWithWallet = useAuthStore(
    (store) => store.requestSignInWithWallet,
  );

  const tokens = data?.tokens || [];
  const inventoryCount = dataCount?.tokens?.[0]?.count;

  const title = `${network === 'testnet' ? 'TESTNET ' : ''}${
    token ? `${token.name} (${token.symbol}) ` : ''
  }NFT Stats, Holders & Transactions | NearBlocks`;
  const description = token
    ? `All you need to know about the ${token.name} NFT Collection : Statistics, total supply, number of holders, latest transactions & meta-data.`
    : '';
  const thumbnail = `${ogUrl}/og?nft=${
    token?.name && encodeURI(token?.name)
  }&network=${network}&brand=near&nft=true`;

  useEffect(() => {
    if (tab) {
      const index = tabs.indexOf(tab as string);
      if (index !== -1) {
        setTabIndex(index);
      }
    }
  }, [tab]);

  const onTab = (index: number) => {
    setTabIndex(index);
    const { id } = router.query;
    const newQuery = { id, tab: tabs[index] };
    router.push({
      pathname: router.pathname,
      query: newQuery,
    });
  };

  const getClassName = (selected: boolean) =>
    classNames(
      'text-xs leading-4 font-medium overflow-hidden inline-block cursor-pointer p-2 mb-3 mr-2 focus:outline-none rounded-lg',
      {
        'hover:bg-neargray-800 bg-neargray-700 dark:bg-black-200 hover:text-nearblue-600 text-nearblue-600 dark:text-neargray-10':
          !selected,
        'bg-green-600 dark:bg-green-250 text-white': selected,
      },
    );

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="title" content={title} />
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="twitter:title" content={title} />
        <meta property="twitter:description" content={description} />
        <meta property="og:image" content={thumbnail} />
        <meta name="twitter:image" content={thumbnail} />
        <meta property="og:image:secure_url" content={thumbnail} />
        <meta name="twitter:image:src" content={thumbnail} />
        <link rel="canonical" href={`${appUrl}/nft-token/${id}`} />
      </Head>
      <div className="relative container mx-auto px-3">
        <Overview
          token={token}
          status={status}
          transfers={transfers}
          holders={holders}
        />
        <div className="py-6"></div>
        <div className="block lg:flex lg:space-x-2 mb-4">
          <div className="w-full">
            <Tabs onSelect={(index) => onTab(index)} selectedIndex={tabIndex}>
              <TabList className={'flex flex-wrap'}>
                <Tab
                  className={getClassName(tabs[0] === tabs[tabIndex])}
                  selectedClassName="rounded-lg bg-green-600 dark:bg-green-250 text-white"
                >
                  <h2>Transfers</h2>
                </Tab>
                <Tab
                  className={getClassName(tabs[1] === tabs[tabIndex])}
                  selectedClassName="rounded-lg bg-green-600 dark:bg-green-250 text-white"
                >
                  <h2>Holders</h2>
                </Tab>
                <Tab
                  className={getClassName(tabs[2] === tabs[tabIndex])}
                  selectedClassName="rounded-lg bg-green-600 dark:bg-green-250 text-white"
                >
                  <h2>Inventory</h2>
                </Tab>
                <Tab
                  className={getClassName(tabs[3] === tabs[tabIndex])}
                  selectedClassName="rounded-lg bg-green-600 dark:bg-green-250 text-white"
                >
                  <h2>Comments</h2>
                </Tab>
              </TabList>
              <div className="bg-white dark:bg-black-600 soft-shadow rounded-xl pb-1">
                <TabPanel>
                  <Transfers
                    txns={txns}
                    count={transfers}
                    error={error}
                    cursor={txnCursor}
                    tab={tab}
                  />
                </TabPanel>
                <TabPanel>
                  <Holders
                    tokens={token}
                    status={status}
                    holder={holder}
                    count={holders}
                    error={error}
                    tab={tab}
                  />
                </TabPanel>
                <TabPanel>
                  <Inventory
                    token={token}
                    tokens={tokens}
                    count={inventoryCount}
                    error={error}
                    tab={tab}
                  />
                </TabPanel>
                <TabPanel>
                  <VmComponent
                    src={components?.commentsFeed}
                    defaultSkelton={<Comment />}
                    props={{
                      network: network,
                      path: `nearblocks.io/nft-token/${id}`,
                      limit: 10,
                      requestSignInWithWallet,
                    }}
                    loading={<Comment />}
                  />
                </TabPanel>
              </div>
            </Tabs>
          </div>
        </div>
        <div className="py-6"></div>
      </div>
    </>
  );
};

NFToken.getLayout = (page: ReactElement) => (
  <Layout
    statsDetails={page?.props?.statsDetails}
    latestBlocks={page?.props?.latestBlocks}
  >
    {page}
  </Layout>
);

export default NFToken;
