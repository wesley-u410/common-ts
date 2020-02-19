import * as Sequelize from 'sequelize'
import { Store, StorePair } from '@connext/types'

export class Record extends Sequelize.Model {
  public path!: string
  public value!: any

  static initialize(sequelize: Sequelize.Sequelize) {
    Record.init(
      {
        path: {
          type: Sequelize.STRING,
          primaryKey: true,
        },
        value: {
          type: Sequelize.JSONB,
          allowNull: false,
        },
      },
      { sequelize },
    )
  }
}

export class SequelizeConnextStore implements Store {
  sequelize: Sequelize.Sequelize

  constructor(sequelize: Sequelize.Sequelize) {
    this.sequelize = sequelize
  }

  async set(pairs: StorePair[]): Promise<void> {
    for (const pair of pairs) {
      if (pair.path.includes('channel') && !pair.value.multisigAddress) {
        throw new Error('multisigAddress is required for channel values')
      }
      await Record.upsert({
        path: pair.path,
        value: pair.value,
      })
    }
  }

  async get(path: string): Promise<any> {
    // Special case for certain paths
    if (path.endsWith('channel')) {
      let res = await Record.findAll({
        where: {
          path: {
            [Sequelize.Op.like]: `%${path}%`,
          },
        },
      })
      const records: { [key: string]: any } = {}
      res.forEach((record: Record): void => {
        const key = record.value.multisigAddress
        const value = record.value
        if (value !== null) {
          records[key] = value
        }
      })
      return records
    } else {
      let res = await Record.findOne({
        where: {
          path,
        },
      })
      return !res ? undefined : res.value
    }
  }

  async reset(): Promise<void> {
    // Remove all records from the table
    await Record.destroy({
      where: {},
      truncate: true,
    })
  }

  async restore(): Promise<StorePair[]> {
    throw 'Unimplemented'
  }
}
