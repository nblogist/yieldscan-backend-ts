import { Container } from 'typedi';
import mongoose from 'mongoose';
import { IStakingInfo } from '../../interfaces/IStakingInfo';

const validatorsDashboard = async (req, res, next) => {
  const Logger = Container.get('logger');
  try {
    const SessionValidators = Container.get('SessionValidators') as mongoose.Model<IStakingInfo & mongoose.Document>;

    const sortedData = await SessionValidators.aggregate([
      {
        $lookup: {
          from: 'accountidentities',
          localField: 'stashId',
          foreignField: 'stashId',
          as: 'info',
        },
      },
      {
        $sort: {
          rewardsPer100KSM: -1,
        },
      },
    ]);
    // console.log(sortedData);
    sortedData.map((x) => {
      x.commission = x.commission / Math.pow(10, 7);
      x.totalStake = x.totalStake / Math.pow(10, 12);
      x.ownStake = x.ownStake / Math.pow(10, 12);
      x.othersStake = x.nominators.reduce((a, b) => a + b.stake, 0) / Math.pow(10, 12);
      x.numOfNominators = x.nominators.length;
      x.estimatedPoolReward = x.estimatedPoolReward / Math.pow(10, 12);
      x.name = x.info[0].display;
    });
    // console.log('sortedData', sortedData);
    const result = sortedData.map(
      ({
        stashId,
        commission,
        ownStake,
        othersStake,
        estimatedPoolReward,
        numOfNominators,
        rewardsPer100KSM,
        riskScore,
        name,
      }) => ({
        stashId,
        commission,
        ownStake,
        othersStake,
        estimatedPoolReward,
        numOfNominators,
        rewardsPer100KSM,
        riskScore,
        name,
      }),
    );

    res.json(result).status(200);
  } catch (e) {
    Logger.error('🔥 Error attaching user to req: %o', e);
    return next(e);
  }
};

export default validatorsDashboard;
