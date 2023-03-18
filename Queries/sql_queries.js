const get_team_process_query = (teamRequest) => {

    const positions = teamRequest.map(x => 
        `SELECT * FROM Players WHERE position = "${x.position}"`);

    return positions.join(' UNION ')
}

const is_position_count_valid = (players, teamReq) => {
    if(players.length < 1)
        return false;

    for (const tr of teamReq) {
        let position_players = players.filter(x => x.position === tr.position);

        if(position_players.length < tr.numberOfPlayers)
            return false;
    }

    return true;
}


module.exports =  {
    get_team_process_query,
    is_position_count_valid
}