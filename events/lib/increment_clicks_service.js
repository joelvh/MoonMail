'use strict';

import { debug } from './index';
import { Link } from './models/link';
import * as async from 'async';

class IncrementClicksService {
  constructor(kinesisRecords) {
    this.kinesisRecords = kinesisRecords;
  }

  incrementAll() {
    return new Promise((resolve, reject) => {
      async.forEachOf(this.opensByCampaign, (count, cid, cb) => {
        this.incrementCount(cid, count)
          .then((data) => {
            cb();
          })
          .catch((err) => {
            cb(err);
          });
      }, err => {
        if (err) {
          debug('= IncrementClicksService.incrementAll', 'Error incrementing opens', err);
          reject(err);
        } else {
          debug('= IncrementClicksService.incrementAll', 'Successfully incremented opens');
          resolve();
        }
      });
    });
  }

  incrementCount(campaignId, count = 1) {
    debug('= IncrementClicksService.incrementCount', 'Campaign ID:', campaignId, 'Count:', count);
    return Link.incrementOpens(campaignId, count);
  }

  get clicksByLink() {
    if (this.kinesisRecords) {
      let clicksPerLink = {};
      for (let record of this.kinesisRecords) {
        let data = this._getRecordData(record);
        if (clicksPerLink[data.linkId]) {
          clicksPerLink[data.linkId].count += 1;
        } else {
          clicksPerLink[data.linkId] = {
            campaignId: data.campaignId,
            count: 1
          };
        }
      }
      return clicksPerLink;
    }
  }

  _getRecordData(kisenisRecord) {
    const data = new Buffer(kisenisRecord.kinesis.data, 'base64').toString();
    return JSON.parse(data);
  }
}

module.exports.IncrementClicksService = IncrementClicksService;
