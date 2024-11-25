import { Knex } from 'nb-knex';
import { types } from 'nb-lake';
import { Network, StakingEvent, StakingEventType } from 'nb-types';
import { retry } from 'nb-utils';

import config from '#config';
import { isExecutionSuccess } from '#libs/utils';
import { Event } from '#types/types';

const POOL_PATTERN = {
  MAINNET: /\.pool(v1)?\.near$/,
  TESTNET: /^.+\.pool\..+\.m0$/,
};

const LOG_PATTERN = {
  CONTRACT:
    /Contract total staked balance is (\d+)\. Total number of shares (\d+)/,
  DEPOSIT: /@([\S]+) deposited (\d+)\. New unstaked balance is (\d+)/,
  REWARD:
    /Epoch (\d+):.Contract received total rewards of (\d+) tokens. New total staked balance is (\d+). Total number of shares (\d+)/,
  STAKE:
    /@([\S]+) staking (\d+)\. Received (\d+) new staking shares\. Total (\d+) unstaked balance and (\d+) staking shares/,
  UNSTAKE:
    /@([\S]+) unstaking (\d+)\. Spent (\d+) staking shares\. Total (\d+) unstaked balance and (\d+) staking shares/,
  WITHDRAW: /@([\S]+) withdrawing (\d+)\. New unstaked balance is (\d+)/,
};

export const storeStakingData = async (
  knex: Knex,
  message: types.StreamerMessage,
) => {
  await Promise.all(
    message.shards.map(async (shard) => {
      await storeChunkData(knex, shard, message.block.header);
    }),
  );
};

const storeChunkData = async (
  knex: Knex,
  shard: types.Shard,
  block: types.BlockHeader,
) => {
  const events: StakingEvent[] = [];

  shard.receiptExecutionOutcomes.forEach((outcome) => {
    const contract = outcome.receipt?.receiverId;

    if (
      outcome.receipt &&
      isStakingPool(contract) &&
      outcome.executionOutcome.outcome.logs.length &&
      isExecutionSuccess(outcome.executionOutcome.outcome.status)
    ) {
      const receipt = outcome.receipt.receiptId;

      outcome.executionOutcome.outcome.logs.forEach((log) => {
        const event = matchEvents(log);

        if (event) {
          events.push({
            absolute_shares: event.totalShares ?? null,
            absolute_unstaked_amount: event.totalUnstaked ?? null,
            account: event.account ?? null,
            amount: event.amount ?? null,
            block_height: block.height,
            block_timestamp: block.timestampNanosec,
            contract: contract!,
            contract_shares: event.contractShares ?? null,
            contract_staked: event.contractStaked ?? null,
            delta_shares: event.shares ?? null,
            event_index: '',
            receipt_id: receipt,
            type: event.type,
          });
        }
      });
    }
  });

  const length = events.length;

  if (length) {
    const startIndex =
      BigInt(block.timestampNanosec) * 100_000_000n * 100_000_000n +
      BigInt(shard.shardId) * 10_000_000n;

    for (let index = 0; index < length; index++) {
      events[index].event_index = String(startIndex + BigInt(index));
    }

    await retry(async () => {
      await knex('staking_events')
        .insert(events)
        .onConflict(['event_index'])
        .ignore();
    });
  }
};

const isStakingPool = (contract?: string) => {
  if (!contract) return false;

  if (config.network === Network.MAINNET) {
    return POOL_PATTERN.MAINNET.test(contract);
  }

  return POOL_PATTERN.TESTNET.test(contract);
};

const matchEvents = (log: string): Event | null => {
  switch (true) {
    case LOG_PATTERN.DEPOSIT.test(log): {
      const match = log.match(LOG_PATTERN.DEPOSIT);

      console.log({ deposit: match });

      if (match?.length === 4) {
        return {
          account: match[1],
          amount: match[2],
          totalUnstaked: match[3],
          type: StakingEventType.DEPOSIT,
        };
      }

      return null;
    }
    case LOG_PATTERN.WITHDRAW.test(log): {
      const match = log.match(LOG_PATTERN.WITHDRAW);

      console.log({ withdraw: match });

      if (match?.length === 4) {
        return {
          account: match[1],
          amount: match[2],
          totalUnstaked: match[3],
          type: StakingEventType.WITHDRAW,
        };
      }

      return null;
    }
    case LOG_PATTERN.STAKE.test(log): {
      const match = log.match(LOG_PATTERN.STAKE);

      console.log({ stake: match });

      if (match?.length === 6) {
        return {
          account: match[1],
          amount: match[2],
          shares: match[3],
          totalShares: match[5],
          totalUnstaked: match[4],
          type: StakingEventType.STAKE,
        };
      }

      return null;
    }
    case LOG_PATTERN.UNSTAKE.test(log): {
      const match = log.match(LOG_PATTERN.UNSTAKE);

      console.log({ unstake: match });

      if (match?.length === 6) {
        return {
          account: match[1],
          amount: match[2],
          shares: match[3],
          totalShares: match[5],
          totalUnstaked: match[4],
          type: StakingEventType.UNSTAKE,
        };
      }

      return null;
    }
    case LOG_PATTERN.CONTRACT.test(log): {
      const match = log.match(LOG_PATTERN.CONTRACT);

      console.log({ contract: match });

      if (match?.length === 3) {
        return {
          contractShares: match[2],
          contractStaked: match[1],
          type: StakingEventType.CONTRACT,
        };
      }

      return null;
    }
    case LOG_PATTERN.REWARD.test(log): {
      const match = log.match(LOG_PATTERN.REWARD);

      console.log({ reward: match });

      if (match?.length === 5) {
        return {
          amount: match[2],
          contractShares: match[4],
          contractStaked: match[3],
          type: StakingEventType.REWARD,
        };
      }

      return null;
    }
    default:
      return null;
  }
};
