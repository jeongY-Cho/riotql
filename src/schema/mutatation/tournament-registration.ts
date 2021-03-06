import { schema } from 'nexus'
import { APIKeyType } from '../../app'

schema.extendType({
  type: 'Mutation',
  definition(t) {
    t.int('code', {
      args: {
        TournamentRegistrationParameters: schema.arg({
          type: 'Tournamentv4TournamentRegistrationParametersInput',
          required: true,
        }),
      },
      async resolve(root, args, ctx) {
        let res = await ctx.api(
          APIKeyType.TOURNAMENT,
          'americas',
          'tournament-v4.registerTournament',
          undefined,
          {
            providerId: args.TournamentRegistrationParameters.providerId,
            name: args.TournamentRegistrationParameters.name ?? undefined,
          },
        )
        if (!res) throw new Error("some error from this, but shouldn't")
        return res.data
      },
    })
  },
})
