import { define } from 'typeorm-seeding';
import { Contacts } from '../entities';
import Faker from 'faker';


define(Contacts, (faker: typeof Faker) => {
  const contact = new Contacts();
  contact.metadata = { 'merge_tags': {} };
  return contact;
});