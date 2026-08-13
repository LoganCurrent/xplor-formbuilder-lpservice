import { define } from 'typeorm-seeding';
import { Checkoutflows } from '../entities';
import Faker from 'faker';


define(Checkoutflows, (faker: typeof Faker) => {
  const checkoutflow = new Checkoutflows();
  checkoutflow.contactListId = faker.random.number(1e4);
  return checkoutflow;
});