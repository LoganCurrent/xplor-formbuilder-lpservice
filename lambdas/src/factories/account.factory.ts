import { define } from 'typeorm-seeding';
import { Accounts } from '../entities';
import Faker from 'faker';


define(Accounts, (faker: typeof Faker) => {
  const account = new Accounts();
  return account;
});
