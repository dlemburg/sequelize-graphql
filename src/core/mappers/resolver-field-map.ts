import pluralize from 'pluralize';
import {
  GeneratedResolverField,
  ResolverFieldMap,
  ResolverOptions,
  RESOLVER_MAP_KEYS,
} from '../../types';
import { lowercaseFirstLetter } from '../../util/general-util';
import { pagedGql, whereInputNameGql } from '../graphql';
import { optionsPagedQueryInputNameGql, optionsQueryInputNameGql } from '../graphql/options';

const sanitize = (value: string, options: ResolverOptions): string => {
  const result = options?.pluralize !== false ? pluralize(value) : value;

  return result;
};

export const getResolverFieldMap = (
  name: string,
  options: ResolverOptions
): ResolverFieldMap<typeof RESOLVER_MAP_KEYS> => {
  const loweredName = lowercaseFirstLetter(name);
  const pluralizedName = sanitize(name, options);
  const pluralizedLoweredName = sanitize(loweredName, options);

  return {
    [GeneratedResolverField.FIND_ONE]: {
      operationType: 'query',
      name: `${loweredName}`,
      args: [{ where: whereInputNameGql(name) }, { options: optionsQueryInputNameGql() }],
      returnType: `${name}`,
      key: GeneratedResolverField.FIND_ONE,
    },
    [GeneratedResolverField.FIND_MANY]: {
      operationType: 'query',
      name: `${pluralizedLoweredName}`,
      args: [{ where: whereInputNameGql(name) }, { options: optionsQueryInputNameGql() }],
      returnType: `[${name}]!`,
      key: GeneratedResolverField.FIND_MANY,
    },
    [GeneratedResolverField.FIND_MANY_PAGED]: {
      operationType: 'query',
      name: `${pluralizedLoweredName}Paged`,
      args: [{ where: whereInputNameGql(name) }, { options: optionsPagedQueryInputNameGql() }],
      returnType: `[${pagedGql(name)}]!`,
      key: GeneratedResolverField.FIND_MANY_PAGED,
    },
    [GeneratedResolverField.FIND_ALL]: {
      operationType: 'query',
      name: `all${pluralizedName}`,
      args: [],
      returnType: `[${name}]!`,
      key: GeneratedResolverField.FIND_ALL,
    },
    [GeneratedResolverField.CREATE_MUTATION]: {
      operationType: 'mutation',
      name: `create${name}`,
      args: [{ input: `${name}Input!` }],
      returnType: `${name}!`,
      key: GeneratedResolverField.CREATE_MUTATION,
    },
    [GeneratedResolverField.CREATE_MANY_MUTATION]: {
      operationType: 'mutation',
      name: `createMany${name}`,
      args: [{ input: `[${name}Input!]!` }],
      returnType: `[${name}!]!`,
      key: GeneratedResolverField.CREATE_MANY_MUTATION,
    },
    [GeneratedResolverField.UPDATE_MUTATION]: {
      operationType: 'mutation',
      name: `update${name}`,
      args: [{ where: whereInputNameGql(name) }, { input: `Update${name}Input!` }],
      returnType: `${name}!`,
      key: GeneratedResolverField.UPDATE_MUTATION,
    },
    [GeneratedResolverField.DELETE_MUTATION]: {
      operationType: 'mutation',
      name: `delete${name}`,
      args: [{ where: whereInputNameGql(name) }, { options: 'DeleteOptions' }],
      returnType: `DeleteResponse`,
      key: GeneratedResolverField.DELETE_MUTATION,
    },
    [GeneratedResolverField.UPSERT_MUTATION]: {
      operationType: 'mutation',
      name: `upsert${name}`,
      args: [{ where: whereInputNameGql(name) }, { input: `${name}Input!` }],
      returnType: `${name}!`,
      key: GeneratedResolverField.UPSERT_MUTATION,
    },
  };
};
