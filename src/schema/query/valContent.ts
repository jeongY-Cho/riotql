import { schema } from 'nexus'
import bath from 'bath-es5'
import { OpenAPIClient } from '../../../openapi-client-axios'
import { OperationMethods, PathsDictionary } from '../../generated/riot-types'

schema.extendType({
  type: 'Query',
  definition(t) {
    t.field('valorantContent', {
      type: 'Valcontentv1Content',
      args: {
        locale: 'Locale',
        region: schema.arg({ type: 'ValContentRegion', required: true }),
      },
      async resolve(root, args, context) {
        let baseURL = context.OpenAPI.getBaseURL()!
        let client = context.client as OpenAPIClient<
          OperationMethods,
          PathsDictionary
        >
        let parseURL = baseURL.replace('americas', args.region.toLowerCase())

        // FIXME: something breaks this
        let res = await client['val-content-v1.getContent'](
          { locale: args.locale ? hyphenLocale(args.locale) : undefined },
          {},
          {
            baseURL: parseURL,
            headers: {
              'X-Riot-Token':
                process.env.RIOT_API_VAL_KEY ||
                process.env.RIOT_API_DEVELOPMENT_KEY ||
                '',
            },
          },
        )
        if (!res)
          throw new Error(
            'no val content returned which is weird because it should',
          )

        return res.data
      },
    })
  },
})

schema.extendType({
  type: 'Valcontentv1ContentItem',
  definition(t) {
    t.field('localizedNames', {
      type: 'Valcontentv1LocalizedNames',
      nullable: true,
      resolve(root) {
        // @ts-expect-error
        return root.localizedNames
          ? // @ts-expect-error
            (unhyphenObject(root.localizedNames) as any)
          : null
      },
    })
  },
})

schema.enumType({
  name: 'ValContentRegion',
  description: 'Valorant content regions',
  members: ['NA', 'BR', 'EU', 'KR', 'LATAM', 'NA'],
})

schema.enumType({
  name: 'Locale',
  description: 'Locale for localizedNames',
  members: [
    'arAE',
    'deDE',
    'enGB',
    'enUS',
    'esES',
    'esMX',
    'frFR',
    'idID',
    'itIT',
    'jaJP',
    'koKR',
    'plPL',
    'ptBR',
    'ruRU',
    'thTH',
    'trTR',
    'viVN',
    'zhCN',
    'zhTW',
  ],
})

function hyphenLocale(locale: string) {
  return locale.slice(0, 2) + '-' + locale.slice(2)
}

function unhyphenLocale(locale: string) {
  return locale.slice(0, 2) + locale.slice(3)
}

function unhyphenObject(localeObj: { [key: string]: string }) {
  return Object.keys(localeObj).reduce((acc, cur) => {
    acc[unhyphenLocale(cur)] = localeObj[cur]
    return acc
  }, {} as { [key: string]: string })
}
