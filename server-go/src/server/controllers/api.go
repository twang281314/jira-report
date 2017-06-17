package controllers

import (
	"github.com/astaxie/beego"
)

type MainController struct {
	beego.Controller
}

func (this *MainController) Get() {
	this.Data["json"] = map[string]interface{}{"name": "astaxie"}
	this.ServeJSON()
}
