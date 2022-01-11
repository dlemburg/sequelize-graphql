import {
  parseResolveInfo,
  simplifyParsedResolveInfoFragmentWithType,
} from 'graphql-parse-resolve-info';
import { getAttributes } from '../services/base-service/util';
import { ModelAttribute, SchemaMapOptions } from '../../types';
import { parseWhere } from '../util';
import SequelizeGraphql from '../..';

type RecursiveInclude = {
  include: RecursiveInclude[];
  association: string;
};

type QueryAttributes = {
  include?: RecursiveInclude[];
  attributes?: string[];
};

type BuildIncludeInput = {
  association: string;
} & QueryAttributes;

type FieldIntrospectionTuple = [string, any];

const buildInclude = ({ association, include, attributes = [] }: BuildIncludeInput) => {
  return [
    {
      association,
      attributes,
      ...(include?.length && { include }),
    },
  ];
};

const recurseQueryFields = (
  fieldEntries: any = [],
  modelAttributes: ModelAttribute,
  modelMapOptions: SchemaMapOptions
): QueryAttributes => {
  const models = SequelizeGraphql().getSequelize().models;
  // const associationFields = fieldEntries.filter(([xKey, xValue]: FieldIntrospectionTuple) => {
  //   const result = Object.keys(xValue?.fieldsByTypeName ?? {});
  //   return result?.length && models?.[result[0]];
  // });
  // const attributeFields = fieldEntries.filter(([xKey, xValue]: FieldIntrospectionTuple) => {
  //   const result = Object.keys(xValue?.fieldsByTypeName ?? {});
  //   return !result?.length && !models?.[result[0]];
  // });

  const result = fieldEntries?.reduce(
    (acc, [key, value]: [string, any]) => {
      const associationValue = modelAttributes?.associations?.[key];
      const attributeValue = modelAttributes?.[key];
      const where = parseWhere(value?.fieldsByTypeName?.args?.where, modelMapOptions);

      if (attributeValue) {
        acc.attributes.push(key);
      } else if (associationValue?.type) {
        const Model = associationValue?.type && models?.[associationValue?.type];
        const fields = value?.fieldsByTypeName?.[associationValue?.type];

        if (Model) {
          const nextAssociationFields = Object.entries(fields).filter(([xKey, xValue]: any) => {
            const result = Object.keys(xValue?.fieldsByTypeName ?? {});
            return result?.length && models?.[result[0]];
          });
          const attributeFields = Object.keys(fields).filter((field) => {
            const result = nextAssociationFields.find((y) => y[0] === field);
            return !result;
          });

          const associationFields = nextAssociationFields.reduce(
            (acc: any, x: FieldIntrospectionTuple) => {
              const fieldName = x[1].name;
              const fieldsByType = x[1].fieldsByTypeName;
              const modelName = Object.keys(x[1]?.fieldsByTypeName ?? {})?.[0];
              const nextQueryFields = Object.entries(fieldsByType[modelName]);
              const nextModelAttributes = getAttributes(models[modelName])();

              const { attributes: includeAttributes, include: associatedInclude } =
                recurseQueryFields(nextQueryFields, nextModelAttributes, modelMapOptions);

              const baseInclude = buildInclude({
                association: fieldName,
                include: associatedInclude,
                attributes: includeAttributes,
              });

              acc.include = acc?.include ? [...acc.include, ...baseInclude] : baseInclude;

              return acc;
            },
            { attributes: [], include: undefined }
          );

          const baseInclude = buildInclude({
            association: key,
            include: associationFields?.include,
          });
          acc.include = acc?.include ? [...acc.include, ...baseInclude] : baseInclude;
        }
      }

      return acc;
    },
    { attributes: [], include: undefined } as any
  );

  return result;
};

export class QueryAttributeBuilder {
  public static build(model, resolveInfo, schemaMapOptions: SchemaMapOptions): QueryAttributes {
    try {
      const modelAttributes = getAttributes(model)();
      const parsedResolveInfoFragment = parseResolveInfo(resolveInfo) as any;
      const info = simplifyParsedResolveInfoFragmentWithType(
        parsedResolveInfoFragment,
        resolveInfo.returnType
      );

      const fields = Object.entries(info.fields);
      const { attributes, include } = recurseQueryFields(fields, modelAttributes, schemaMapOptions);

      return { attributes, include };
    } catch (err) {
      return {};
    }
  }
}
