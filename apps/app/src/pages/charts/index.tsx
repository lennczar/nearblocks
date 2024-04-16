import Head from 'next/head';
import Layout from '@/components/Layouts';
import Index from '@/components/skeleton/charts/Index';
import { VmComponent } from '@/components/vm/VmComponent';
import { useBosComponents } from '@/hooks/useBosComponents';
import { networkId, appUrl } from '@/utils/config';
import useTranslation from 'next-translate/useTranslation';
import { ReactElement, useEffect, useRef, useState } from 'react';
import Notice from '@/components/common/Notice';
import { useTheme } from 'next-themes';

const Charts = () => {
  const { t } = useTranslation();
  const components = useBosComponents();
  const heightRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState({});
  const { theme } = useTheme();

  const updateOuterDivHeight = () => {
    if (heightRef.current) {
      const Height = heightRef.current.offsetHeight;
      setHeight({ height: Height });
    } else {
      setHeight({});
    }
  };
  useEffect(() => {
    updateOuterDivHeight();
    window.addEventListener('resize', updateOuterDivHeight);

    return () => {
      window.removeEventListener('resize', updateOuterDivHeight);
    };
  }, []);
  const onChangeHeight = () => {
    setHeight({});
  };
  return (
    <>
      <Head>
        <title>{t('charts:metaTitle')}</title>
        <meta name="title" content={t('charts:metaTitle')} />
        <meta name="description" content={t('charts:metaDescription')} />
        <meta property="og:title" content={t('charts:metaTitle')} />
        <meta property="og:image" content="/thumbnail/charts_statistics.png" />
        <meta property="og:description" content={t('charts:metaDescription')} />
        <meta property="twitter:title" content={t('charts:metaTitle')} />
        <meta
          property="twitter:image"
          content="/thumbnail/charts_statistics.png"
        />
        <meta
          property="twitter:description"
          content={t('charts:metaDescription')}
        />
        <link rel="canonical" href={`${appUrl}/charts`} />
      </Head>
      <div className="bg-hero-pattern dark:bg-hero-pattern-dark h-72">
        <div className="container mx-auto px-3">
          <h1 className="mb-4 pt-8 sm:!text-2xl text-xl text-white">
            {t('charts:heading')}
          </h1>
        </div>
      </div>
      <div className="mx-auto px-3 -mt-48">
        <div className="container mx-auto px-3 -mt-36">
          <div style={height} className="relative">
            <VmComponent
              src={components?.charts}
              skeleton={<Index className="absolute" ref={heightRef} />}
              defaultSkelton={<Index />}
              onChangeHeight={onChangeHeight}
              props={{
                poweredBy: false,
                network: networkId,
                t: t,
                theme: theme,
              }}
              loading={<Index className="absolute" ref={heightRef} />}
            />
          </div>
        </div>
      </div>
      <div className="py-8"></div>
    </>
  );
};

Charts.getLayout = (page: ReactElement) => (
  <Layout notice={<Notice />}>{page}</Layout>
);

export default Charts;
