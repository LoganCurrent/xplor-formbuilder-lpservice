import { define } from 'typeorm-seeding';
import {  MergeTag } from '../entities';
import Faker from 'faker';


define(MergeTag, (faker: typeof Faker) => {
  const mergeTag = new MergeTag();
  mergeTag.identifier = faker.lorem.word();
  mergeTag.value = faker.lorem.word();
  mergeTag.account_id = faker.random.number(1e4);
  mergeTag.label = faker.lorem.word();
  mergeTag.franchise = faker.random.boolean();
  mergeTag.label_is_locked = faker.random.boolean();
  return mergeTag;
});