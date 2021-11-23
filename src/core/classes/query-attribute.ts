import {
  parseResolveInfo,
  simplifyParsedResolveInfoFragmentWithType,
} from 'graphql-parse-resolve-info';
import { getModels } from '../../state';
import { getAttributes } from '../../services/base-service';

type RecursiveInclude = {
  include: RecursiveInclude[];
  association: string;
};

type QueryAttributes = {
  include?: RecursiveInclude;
  attributes?: string[];
};

const recurseQueryFields = (fieldEntries, modelAttributes): QueryAttributes => {
  const Models = getModels();

  const result = (fieldEntries ?? [])?.reduce(
    (acc, [key, value]: any) => {
      const associationValue = modelAttributes?.associations?.[key];
      const attributeValue = modelAttributes?.[key];

      if (associationValue) {
        const Model = associationValue?.type && Models?.[associationValue?.type];
        const fields = value?.fieldsByTypeName?.[associationValue?.type];

        if (Model) {
          const associationFields = Object.entries(fields)
            .filter(([xKey, xValue]: any) => {
              const result = Object.keys(xValue?.fieldsByTypeName ?? {});
              return result?.length && Models?.[result[0]];
            })
            .reduce(
              (acc: any, x: any) => {
                const fields = x[1];
                const modelName = Object.keys(x[1]?.fieldsByTypeName ?? {})?.[0];
                const { attributes, include: associatedInclude } = recurseQueryFields(
                  [[fields.name, fields]],
                  getAttributes(Models[modelName])()
                );

                const baseInclude = [
                  { association: fields.name, include: associatedInclude?.include ?? [] },
                ];
                acc.attributes = attributes;
                acc.include = acc?.include ? [acc.include, ...baseInclude] : baseInclude;

                return acc;
              },
              { attributes: [], include: undefined }
            );

          const baseInclude = [{ association: key, include: associationFields?.include ?? [] }];
          acc.include = acc?.include
            ? { include: [acc.include, ...baseInclude] }
            : { include: baseInclude };
        }
      } else if (attributeValue) {
        acc.attributes.push(key);
      }

      return acc;
    },
    { attributes: [], include: undefined } as any
  );

  return result;
};

export class QueryAttributeBuilder {
  public static build(model, resolveInfo): QueryAttributes {
    try {
      const modelAttributes = getAttributes(model)();
      const parsedResolveInfoFragment = parseResolveInfo(resolveInfo) as any;
      const info = simplifyParsedResolveInfoFragmentWithType(
        parsedResolveInfoFragment,
        resolveInfo.returnType
      );

      const fields = Object.entries(info.fields);
      const { attributes, include } = recurseQueryFields(fields, modelAttributes);

      return { attributes, include };
    } catch (err) {
      return {};
    }
  }
}
