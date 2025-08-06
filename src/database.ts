import { Sequelize } from 'sequelize';
import logger from './logger';

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage:  process.env.DATABASE_PATH ?? './data/database.sqlite',
    logging(query) {
        logger.debug('Sequelize logging', {query});
    },
});

(async () => {
    await sequelize.authenticate();
    if (process.env.NODE_ENV === 'development') {await sequelize.sync()}
})().catch((err) => logger.error('Database connection failed', {err}));


export default sequelize;