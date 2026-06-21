function parseTeam(teamBlock) {
  const { team, venue } = teamBlock;
  return {
    id: team.id,
    name: team.name,
    code: team.code,
    country: team.country,
    founded: team.founded,
    national: team.national,
    logo: team.logo,
    venue: {
      name: venue.name,
      city: venue.city,
      capacity: venue.capacity,
      image: venue.image,
    },
  };
}

module.exports = parseTeam;