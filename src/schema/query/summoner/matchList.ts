import { schema } from 'nexus'
import { APIKeyType } from '../../../app'

schema.extendType({
  type: 'Summonerv4Summoner',
  definition(t) {
    t.field('matchList', {
      type: 'MatchList',
      args: {
        game: schema.arg({ type: '_Game', required: true }),
        filter: 'MatchListFilterInput',
      },
      async resolve(root, args, context) {
        let parseQueue: (queues: string[]) => number[] = (queues) => {
          return queues.map((queueStr) => parseInt(queueStr.slice(1)))
        }

        switch (args.game) {
          case 'League':
            let leagueRes = await context.api(
              APIKeyType.League,
              root.region,
              'match-v4.getMatchlist',
              {
                encryptedAccountId: root.accountId!,
                beginIndex: args.filter?.beginIndex
                  ? args.filter.beginIndex
                  : undefined,
                beginTime: args.filter?.beginTime
                  ? args.filter.beginTime
                  : undefined,
                champion: args.filter?.champion
                  ? args.filter.champion
                  : undefined,
                endIndex: args.filter?.endIndex
                  ? args.filter.endIndex
                  : undefined,
                endTime: args.filter?.endTime ? args.filter.endTime : undefined,
                queue: args.filter?.queue
                  ? parseQueue(args.filter.queue)
                  : undefined,
                season: args.filter?.season ? args.filter.season : undefined,
              },
            )
            if (!leagueRes) throw new Error('no matchList found')
            return leagueRes.data
          case 'TFT':
            let tftRes = await context.api(
              APIKeyType.TFT,
              root.region,
              'tft-match-v1.getMatchIdsByPUUID',
              {
                puuid: root.puuid,
                count: args.filter?.count ? args.filter.count : undefined,
              },
            )
            if (!tftRes) throw new Error('no matchList found')
            return { matches: tftRes.data }
          case 'LOR':
            // TODO LOR matchlist
            throw new Error('no matchlist for lor implemented')
          case 'VAL':
            let valRes = await context.api(
              APIKeyType.VAL,
              root.region,
              'val-match-v1.getMatchlist',
              { puuid: root.puuid },
            )
            if (!valRes) throw new Error('no matchlist found')
            return valRes.data
          default:
            throw new Error(`no matchlist for ${args.game} `)
        }
      },
    })
  },
})

schema.inputObjectType({
  name: 'MatchListFilterInput',
  definition(t) {
    t.list.int('champion', { description: 'Champion Ids' })
    t.list.field('queue', {
      type: 'QueueId',
      description: 'Queue type by id',
    })
    t.list.int('season', { description: 'Season' })
    t.field('endTime', {
      type: 'Long',
      description: 'Timestamp in UNIX milliseconds',
    })
    t.field('beginTime', {
      type: 'Long',
      description: 'Timestamp in UNIX milliseconds',
    })
    t.int('endIndex', {
      description: 'Last index of game to be returned.\n\nSee notes',
    })
    t.int('beginIndex', {
      description: 'First index of game to be returned.\n\nSee notes.',
    })
    t.int('count', {
      description: 'Number of matches to return\n\n#### Note:\n\nOnly for TFT',
    })
  },
})

schema.unionType({
  name: 'MatchList',
  description:
    'Matchlist return types. TFT matchlist returns only a list of ids',
  definition(t) {
    t.members('Matchv4Matchlist', 'TFTMatchIdList', 'Valmatchv1Matchlist')
    t.resolveType(function (source, context, info) {
      // @ts-expect-error
      if (source.history) return 'Valmatchv1Matchlist'
      // @ts-expect-error
      if (source.matches) {
        // @ts-expect-error
        let first = source.matches[0]
        if (first !== null) {
          return first.champion ? 'Matchv4Matchlist' : 'TFTMatchIdList'
        }
      }
      return null
    })
  },
})

schema.objectType({
  name: 'TFTMatchIdList',
  description: 'TFT matchlist return type. Returns a list of match ids',
  definition(t) {
    t.list.string('matches')
  },
})
