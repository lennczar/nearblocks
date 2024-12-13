import Question from '@/components/Icons/Question';
import {
  convertToMetricPrefix,
  fiatValue,
  localFormat,
  shortenAddress,
  yoctoToNear,
} from '@/utils/libs';
import { ReceiptsPropsInfo, RPCTransactionInfo } from '@/utils/types';
import { Tooltip } from '@reach/tooltip';
import useTranslation from 'next-translate/useTranslation';
import Link from 'next/link';
import TransactionActions from './TransactionActions';
import ReceiptStatus from './ReceiptStatus';
import { useEffect, useRef, useState } from 'react';
import useRpc from '@/hooks/useRpc';
import TxnsReceiptStatus from '@/components/common/TxnsReceiptStatus';
import useHash from '@/hooks/useHash';
import { networkId } from '@/utils/config';

interface Props {
  receipt: ReceiptsPropsInfo | any;
  borderFlag?: boolean;
  loading: boolean;
  rpcTxn: RPCTransactionInfo;
  statsData: {
    stats: Array<{
      near_price: string;
    }>;
  };
}

const ReceiptRow = (props: Props) => {
  const { receipt, borderFlag, loading, statsData, rpcTxn } = props;
  const { t } = useTranslation();
  const [block, setBlock] = useState<{ height: string } | null>(null);
  const { getBlockDetails } = useRpc();
  const [pageHash] = useHash();

  const currentPrice = statsData?.stats?.[0]?.near_price || 0;

  const lastBlockHash = useRef<string | null>(null);
  const rowRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (receipt?.block_hash && receipt.block_hash !== lastBlockHash.current) {
      lastBlockHash.current = receipt.block_hash;

      getBlockDetails(receipt.block_hash)
        .then((resp: any) => {
          setBlock(resp?.header);
        })
        .catch(() => {});
    }
  }, [receipt?.block_hash, getBlockDetails]);

  const status = receipt?.outcome?.status;
  const isSuccess =
    status &&
    (('SuccessValue' in status &&
      status.SuccessValue !== null &&
      status.SuccessValue !== undefined) ||
      'SuccessReceiptId' in status);

  const Loader = (props: { className?: string; wrapperClassName?: string }) => {
    return (
      <div
        className={`bg-gray-200 dark:bg-black-200 h-5 rounded shadow-sm animate-pulse ${props.className}`}
      ></div>
    );
  };

  const handleScroll = () => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash;
    const parts = hash.split('#');
    const id = parts.length > 2 ? parts[2] : null;

    if (id && receipt?.receipt_id === id) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          rowRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    handleScroll();
    window.addEventListener('hashchange', handleScroll);

    return () => {
      window.removeEventListener('hashchange', handleScroll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receipt?.receipt_id, pageHash]);

  const deposit =
    Array.isArray(receipt?.actions) && receipt.actions.length > 0
      ? receipt.actions[0]?.args?.deposit ?? 0
      : 0;

  return (
    <div className="divide-solid divide-gray-200 dark:divide-black-200 divide-y">
      <div
        id={`${receipt?.receipt_id}`}
        ref={rowRef}
        className={
          borderFlag
            ? ''
            : 'border-l-4 border-green-400 dark:border-green-250 ml-8 my-2'
        }
      >
        <div className="flex flex-wrap p-4">
          <div className="flex items-center w-full md:w-1/4 mb-2 md:mb-0">
            <Tooltip
              label={t('txns:txn.receipts.receipt.tooltip')}
              className="absolute h-auto max-w-xs bg-black bg-opacity-90 z-10 text-xs text-white px-3 py-2"
            >
              <div>
                <Question className="w-4 h-4 fill-current mr-1" />
              </div>
            </Tooltip>
            {t ? t('txns:txn.receipts.receipt.text.0') : 'Receipt'}
          </div>
          {!receipt || loading ? (
            <div className="w-full md:w-3/4">
              <Loader wrapperClassName="flex w-full max-w-xs" />
            </div>
          ) : (
            <div className="w-full md:w-3/4 font-semibold word-break">
              {receipt?.receipt_id ? receipt?.receipt_id : ''}
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-start p-4">
          <div className="flex items-center w-full md:w-1/4 mb-2 md:mb-0">
            <Tooltip
              label={t('txns:txn.status.tooltip')}
              className="absolute h-auto max-w-xs bg-black bg-opacity-90 z-10 text-xs text-white px-3 py-2"
            >
              <div>
                <div>
                  <Question className="w-4 h-4 fill-current mr-1" />
                </div>
              </div>
            </Tooltip>
            {t ? t('txns:txn.status.text.0') : 'Status'}
          </div>
          {!receipt || loading ? (
            <div className="w-full md:w-3/4">
              <Loader wrapperClassName="flex w-full max-w-xl" />
            </div>
          ) : (
            <div className="w-full md:w-3/4 break-words">
              {receipt?.outcome?.status !== undefined && (
                <TxnsReceiptStatus showLabel status={isSuccess} />
              )}
            </div>
          )}
        </div>
        <div className="flex flex-wrap p-4">
          <div className="flex items-center w-full md:w-1/4 mb-2 md:mb-0">
            <Tooltip
              label={'Block height'}
              className="absolute h-auto max-w-xs bg-black bg-opacity-90 z-10 text-xs text-white px-3 py-2"
            >
              <div>
                <Question className="w-4 h-4 fill-current mr-1" />
              </div>
            </Tooltip>
            {t ? t('txns:txn.receipts.block.text.0') : 'Block'}
          </div>
          {!block?.height || loading ? (
            <div className="w-full md:w-3/4">
              <Loader wrapperClassName="flex w-full max-w-xs" />
            </div>
          ) : block?.height ? (
            <div className="w-full md:w-3/4 word-break">
              <Link
                href={`/blocks/${receipt.block_hash}`}
                className="text-green-500 dark:text-green-250 hover:no-underline font-semibold"
              >
                {localFormat(block?.height)}
              </Link>
            </div>
          ) : (
            ''
          )}
        </div>
        <div>
          <div className="flex flex-wrap p-4">
            <div className="flex items-center w-full md:w-1/4 mb-2 md:mb-0">
              <Tooltip
                label={t('txns:txn.receipts.from.tooltip')}
                className="absolute h-auto max-w-xs bg-black bg-opacity-90 z-10 text-xs text-white px-3 py-2"
              >
                <div>
                  <Question className="w-4 h-4 fill-current mr-1" />
                </div>
              </Tooltip>
              {t ? t('txns:txn.receipts.from.text.0') : 'From'}
            </div>
            {!receipt || loading ? (
              <div className="w-full md:w-3/4">
                <Loader wrapperClassName="flex w-full max-w-sm" />
              </div>
            ) : receipt?.predecessor_id ? (
              <div className="w-full md:w-3/4 word-break">
                <div className="md:flex items-center">
                  <Link
                    href={`/address/${receipt?.predecessor_id}`}
                    className="text-green-500 dark:text-green-250 hover:no-underline font-semibold"
                  >
                    {receipt?.predecessor_id}
                  </Link>
                  {receipt?.receipt?.Action?.signer_public_key &&
                    receipt?.receipt?.Action?.signer_id && (
                      <Tooltip
                        label={'Access key used for this receipt'}
                        className="absolute h-auto max-w-xs bg-black bg-opacity-90 z-10 text-xs text-white px-3 py-2"
                      >
                        <span>
                          &nbsp;
                          <Link
                            href={`/address/${receipt?.receipt?.Action?.signer_id}?tab=accesskeys`}
                            className="text-green-500 dark:text-green-250 hover:no-underline"
                          >
                            (
                            {shortenAddress(
                              receipt?.receipt?.Action?.signer_public_key,
                            )}
                            )
                          </Link>
                        </span>
                      </Tooltip>
                    )}
                </div>
              </div>
            ) : (
              ''
            )}
          </div>
          <div className="flex flex-wrap p-4">
            <div className="flex items-center w-full md:w-1/4 mb-2 md:mb-0">
              <Tooltip
                label={t('txns:txn.receipts.to.tooltip')}
                className="absolute h-auto max-w-xs bg-black bg-opacity-90 z-10 text-xs text-white px-3 py-2"
              >
                <div>
                  <Question className="w-4 h-4 fill-current mr-1" />
                </div>
              </Tooltip>
              {t ? t('txns:txn.receipts.to.text.0') : 'To'}
            </div>
            {!receipt || loading ? (
              <div className="w-full md:w-3/4">
                <Loader wrapperClassName="flex w-full max-w-xs" />
              </div>
            ) : receipt?.receiver_id ? (
              <div className="w-full md:w-3/4 word-break">
                <Link
                  href={`/address/${receipt?.receiver_id}`}
                  className="text-green-500 dark:text-green-250 hover:no-underline font-semibold"
                >
                  {receipt?.receiver_id}
                </Link>
              </div>
            ) : (
              ''
            )}
          </div>
        </div>
        <div className="flex flex-wrap p-4">
          <div className="flex items-center w-full md:w-1/4 mb-2 md:mb-0">
            <Tooltip
              label={t('txns:txn.receipts.burnt.tooltip')}
              className="absolute h-auto max-w-xs bg-black bg-opacity-90 z-10 text-xs text-white px-3 py-2"
            >
              <div>
                <Question className="w-4 h-4 fill-current mr-1" />
              </div>
            </Tooltip>
            {t
              ? t('txns:txn.receipts.burnt.text.0')
              : 'Burnt Gas & Tokens by Receipt'}
          </div>
          {!receipt || loading ? (
            <div className="w-full md:w-3/4">
              <Loader wrapperClassName="flex w-36" />
            </div>
          ) : receipt?.outcome?.gas_burnt ? (
            <div className="w-full items-center text-xs flex md:w-3/4 break-words max-w-xs">
              <div className="bg-orange-50  dark:bg-black-200 rounded-md px-2 py-1">
                <span className="text-xs mr-2">🔥 </span>
                {receipt?.outcome?.gas_burnt
                  ? convertToMetricPrefix(receipt?.outcome?.gas_burnt) + 'gas'
                  : ''}
                <span className="text-gray-300 px-1">|</span>{' '}
                {receipt?.outcome?.tokens_burnt
                  ? yoctoToNear(receipt?.outcome?.tokens_burnt, true)
                  : ''}{' '}
                Ⓝ
              </div>
            </div>
          ) : (
            ''
          )}
        </div>
        <div className="flex items-start flex-wrap p-4">
          <div className="flex items-center w-full md:w-1/4 mb-2 md:mb-0">
            <Tooltip
              label={t('txns:txn.receipts.actions.tooltip')}
              className="absolute h-auto max-w-xs bg-black bg-opacity-90 z-10 text-xs text-white px-3 py-2"
            >
              <div>
                <Question className="w-4 h-4 fill-current mr-1" />
              </div>
            </Tooltip>
            {t ? t('txns:txn.receipts.actions.text.0') : 'Actions'}
          </div>
          {!receipt || loading ? (
            <div className="w-full md:w-3/4">
              <Loader wrapperClassName="flex w-full my-1 max-w-xs" />
              <Loader wrapperClassName="flex w-full" />
              <Loader wrapperClassName="flex w-full" />
              <Loader wrapperClassName="flex w-full" />
            </div>
          ) : receipt?.actions ? (
            <div className="w-full md:w-3/4 word-break space-y-4">
              {receipt &&
                receipt?.actions?.map((action: any, i: number) => (
                  <TransactionActions
                    key={i}
                    action={action}
                    receiver={receipt?.receiver_id}
                  />
                ))}
            </div>
          ) : (
            ''
          )}
        </div>

        <div className="flex items-start flex-wrap p-4">
          <div className="flex items-center w-full md:w-1/4 mb-2 md:mb-0">
            <Tooltip
              label={'Deposit value attached with the receipt'}
              className="absolute h-auto max-w-xs bg-black bg-opacity-90 z-10 text-xs text-white px-3 py-2"
            >
              <div>
                <Question className="w-4 h-4 fill-current mr-1" />
              </div>
            </Tooltip>
            Value
          </div>
          {!receipt || loading ? (
            <div className="w-full md:w-3/4">
              <Loader wrapperClassName="flex w-full" />
              <Loader wrapperClassName="flex w-full" />
              <Loader wrapperClassName="flex w-full" />
            </div>
          ) : (
            <div className="w-full md:w-3/4 break-words space-y-4">
              {receipt && deposit ? yoctoToNear(deposit, true) : deposit ?? '0'}{' '}
              Ⓝ
              {currentPrice && networkId === 'mainnet'
                ? ` ($${fiatValue(
                    yoctoToNear(deposit ?? 0, false),
                    currentPrice,
                  )})`
                : ''}
            </div>
          )}
        </div>
        <div className="flex items-start flex-wrap p-4">
          <div className="flex items-center w-full md:w-1/4 mb-2 md:mb-0">
            <Tooltip
              label={t('txns:txn.receipts.result.tooltip')}
              className="absolute h-auto max-w-xs bg-black bg-opacity-90 z-10 text-xs text-white px-3 py-2"
            >
              <div>
                <Question className="w-4 h-4 fill-current mr-1" />
              </div>
            </Tooltip>
            {t ? t('txns:txn.receipts.result.text.0') : 'Result'}
          </div>
          {!receipt || loading ? (
            <div className="w-full md:w-3/4">
              <Loader wrapperClassName="flex w-full" />
              <Loader wrapperClassName="flex w-full" />
              <Loader wrapperClassName="flex w-full" />
            </div>
          ) : (
            <div className="w-full md:w-3/4 break-words space-y-4">
              {receipt ? <ReceiptStatus receipt={receipt} /> : ''}
            </div>
          )}
        </div>
        <div className="flex items-start flex-wrap p-4">
          <div className="flex items-center w-full md:w-1/4 mb-2 md:mb-0">
            <Tooltip
              label={t('txns:txn.receipts.logs.tooltip')}
              className="absolute h-auto max-w-xs bg-black bg-opacity-90 z-10 text-xs text-white px-3 py-2"
            >
              <div>
                <Question className="w-4 h-4 fill-current mr-1" />
              </div>
            </Tooltip>
            {t ? t('txns:txn.receipts.logs.text.0') : 'Logs'}
          </div>
          {!receipt || loading ? (
            <div className="w-full md:w-3/4">
              <Loader wrapperClassName="flex w-full" />
              <Loader wrapperClassName="flex w-full" />
              <Loader wrapperClassName="flex w-full" />
            </div>
          ) : (
            <div className="w-full md:w-3/4 break-words space-y-4">
              {receipt && receipt?.outcome?.logs?.length > 0 ? (
                <textarea
                  readOnly
                  rows={4}
                  defaultValue={receipt.outcome.logs
                    .map((log: any) => {
                      if (typeof log === 'string') {
                        const match = log.match(/EVENT_JSON:(\{.*\})/);
                        if (match) {
                          try {
                            const parsed = JSON.parse(match[1]);
                            return JSON.stringify(
                              { EVENT_JSON: parsed },
                              null,
                              2,
                            );
                          } catch (error) {
                            console.log('Error parsing JSON:', error, log);
                            return `Invalid JSON log: ${log}`;
                          }
                        } else {
                          return `${log}`;
                        }
                      }
                      return `${log || ''}`;
                    })
                    .join('\n\n')}
                  className={`block appearance-none outline-none w-full border rounded-lg bg-gray-100 dark:bg-black-200 dark:border-black-200 p-3 mt-3 resize-y font-space-mono`}
                ></textarea>
              ) : (
                'No Logs'
              )}
            </div>
          )}
        </div>
      </div>
      {receipt && receipt?.outcome?.outgoing_receipts?.length > 0 && (
        <div className="pb-4">
          {receipt?.outcome?.outgoing_receipts?.map((rcpt: any) => (
            <div className="pl-4 pt-6" key={rcpt?.receipt_id}>
              <div className="mx-4 border-l-4 border-l-gray-200">
                <ReceiptRow
                  receipt={rcpt}
                  borderFlag
                  loading={loading}
                  statsData={statsData}
                  rpcTxn={rpcTxn}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default ReceiptRow;
