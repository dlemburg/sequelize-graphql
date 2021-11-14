import merge from 'lodash/merge';
import { ResolverFactory, TypedefBuilder } from './classes';

export const buildSchema = (models, { schemaMap, baseDirective }) => {
  const result: any = Object.values(models as any).reduce(
    (acc: any, model: any): any => {
      const overrides = schemaMap?.[model.name] ?? {};

      if (overrides?.generate === false) return acc;

      const { generatedGql } = TypedefBuilder({
        model,
        ...overrides,
        options: { ...overrides?.options, baseDirective },
      });
      const resolvers = ResolverFactory({ model }).resolvers();

      acc.typedefs = acc.typedefs + generatedGql;
      acc.resolvers = merge(acc.resolvers, resolvers);

      return acc;
    },
    { typedefs: '', resolvers: {} } as any
  );

  return result;
};
