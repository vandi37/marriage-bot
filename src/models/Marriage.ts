import {DataTypes, Model, Op} from 'sequelize';
import sequelize from '../database';

class Marriage extends Model {
    public id!: number;
    public user1!: number;
    public user2!: number;
    public createdAt!: Date;
    public static async marriageExists(user1: number, user2: number) {
        const marriage = await Marriage.findOne({
            where: {
                [Op.or]: [
                    { user1: user1, user2: user2 },
                    { user1: user2, user2: user1 }
                ]
            }
        });
        return Boolean(marriage);
    }
    public  static async findOneWithUser(marriageId: number, user: number) {
        return await Marriage.findOne({
            where: {
                id: marriageId,
                [Op.or]: [
                    {user1: user},
                    {user2: user}
                ]
            }
        })
    }
    public static async countUniqueUsers() {
        const result = await Marriage.findOne({
            attributes: [
                [sequelize.literal(`(select count(distinct user_id) ` +
                    `from (select user1 as user_id from marriages union select user2 as user_id from marriages) ` +
                    `as combined_users)`), 'count']
            ],
            raw: true
        }) as {count: number} | null;

        return result?.count || 0;
    }
}

Marriage.init({
    id: {type: DataTypes.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true},
    user1: { type: DataTypes.BIGINT, allowNull: false },
    user2: { type: DataTypes.BIGINT, allowNull: false },
    createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { sequelize, modelName: 'marriage' , indexes: [
        {
            unique: true,
            fields: ['user1', 'user2'],
            name: 'unique_marriage'
        },
        {
            unique: true,
            fields: ['user2', 'user1'],
            name: 'unique_marriage_reverse'
        }
    ]});

export default Marriage;