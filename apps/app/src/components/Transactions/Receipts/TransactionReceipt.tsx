import { useCallback, useEffect, useState } from 'react';

import ArrowDown from '@/components/Icons/ArrowDown';
import { TransactionReceiptInfo } from '@/utils/types';

import ReceiptInfo from './ReceiptInfo';
import ReceiptKind from './ReceiptKind';

const TransactionReceipt = (props: TransactionReceiptInfo) => {
  const {
    className,
    convertionReceipt,
    expandAll,
    fellowOutgoingReceipts,
    receipt,
  } = props;

  const [isTxTypeActive, setTxTypeActive] = useState(false);
  const switchActiveTxType = useCallback(() => setTxTypeActive((x) => !x), []);

  useEffect(() => {
    setTxTypeActive(expandAll);
  }, [expandAll]);

  const remainingFellowOutgoingReceipts =
    fellowOutgoingReceipts && fellowOutgoingReceipts?.slice(0, -1);
  const lastFellowOutgoingReceipt =
    fellowOutgoingReceipts && fellowOutgoingReceipts?.at(-1);
  const filterRefundNestedReceipts =
    receipt?.outcome?.nestedReceipts &&
    receipt?.outcome?.nestedReceipts?.filter(
      (nestedReceipt: any) =>
        'outcome' in nestedReceipt && nestedReceipt?.predecessorId !== 'system',
    );
  const nonRefundNestedReceipts =
    filterRefundNestedReceipts && filterRefundNestedReceipts?.slice(0, -1);
  const lastNonRefundNestedReceipt =
    filterRefundNestedReceipts && filterRefundNestedReceipts?.at(-1);

  return (
    <>
      <div
        className={`${
          convertionReceipt
            ? 'pl-0 border-transparent'
            : 'pl-4 md:pl-8 border-green-500 dark:border-green-250'
        } ${className} `}
      >
        {convertionReceipt ? (
          <div className="flex flex-row mb-2.5">
            <div className="bg-gray-200 dark:bg-black-200 h-5 w-5 rounded-full mr-3"></div>
            <div className="text-green-500 dark:text-green-250 text-sm">
              {receipt?.predecessorId}
            </div>
          </div>
        ) : null}

        {lastFellowOutgoingReceipt ? (
          <TransactionReceipt
            className="pb-4 !mt-0 border-l ml-2.5"
            convertionReceipt={false}
            expandAll={expandAll}
            fellowOutgoingReceipts={remainingFellowOutgoingReceipts}
            receipt={lastFellowOutgoingReceipt}
          />
        ) : null}
        <div className="flex flex-col relative border-l border-green-500 dark:border-green-250 py-2 pl-6 ml-2.5">
          {receipt?.actions?.map((action: any, index: number) => (
            <ReceiptKind
              action={action}
              isTxTypeActive={isTxTypeActive}
              key={`${action.kind}_${index}`}
              onClick={switchActiveTxType}
              receipt={receipt}
              receiver={receipt.receiverId}
            />
          ))}
        </div>
        {isTxTypeActive ? (
          <div className="border-l border-green-500 dark:border-green-250 ml-2.5">
            <ReceiptInfo receipt={receipt} />
          </div>
        ) : null}
        <div className="relative flex flex-row my-2.5">
          <ArrowDown
            className={`absolute left-0.5 -top-5 ml-px  w-4 h-4 fill-current text-green-500 dark:text-green-250`}
          />
          <div className="bg-gray-200 dark:bg-black-200 h-5 w-5 rounded-full mr-3"></div>
          <div className="text-green-500 dark:text-green-250 text-sm ">
            {receipt?.receiverId}
          </div>
        </div>
      </div>
      {lastNonRefundNestedReceipt ? (
        <TransactionReceipt
          className="!pl-0 !border-transparent"
          convertionReceipt={false}
          expandAll={expandAll}
          fellowOutgoingReceipts={nonRefundNestedReceipts}
          receipt={lastNonRefundNestedReceipt}
        />
      ) : null}
    </>
  );
};
export default TransactionReceipt;
