getIssueWorkLog(['XDW-1950', 'XDW-2045', 'XDW-2042'], new Buffer("wangtao:8002381")
    .toString("base64"),
    function (error, data) {
        if (error) {
            console.log(error);
        } else {
            logger.info(data);
        }
    });