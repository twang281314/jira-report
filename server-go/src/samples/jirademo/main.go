package main

import (
    "fmt"
    "github.com/andygrunwald/go-jira"
)

func main() {
    jiraClient, err := jira.NewClient(nil, "http://jira.iscs.com.cn/")
    if err != nil {
        panic(err)
    }

    res, err := jiraClient.Authentication.AcquireSessionCookie("wangtao", "8002381")
    if err != nil || res == false {
        fmt.Printf("Result: %v\n", res)
        panic(err)
    }

    issue, _, err := jiraClient.Issue.Get("UTL-37")
    if err != nil {
        panic(err)
    }

    fmt.Printf("%s: %+v\n", issue.Key, issue.Fields)
}