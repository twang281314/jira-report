require("should");
var name = "anytao";
describe("Name", function () {
    it("The name should be anytao", function () {
        name.should.eql("anytao");
    });
});
var Person = function (name) {
    this.name = name;
};
var anytao = new Person(name);
describe("InstanceOf", function () {
    it("anytao should be an instance of Person", function () {
        anytao.should.be.an.instanceof(Person);
    });
    it("anytao should be an instance of Object", function () {
        anytao.should.be.an.instanceof(Object);
    });
});
describe("Property", function () {
    it("anytao should have property name", function () {
        anytao.should.have.property("name");
    });
});