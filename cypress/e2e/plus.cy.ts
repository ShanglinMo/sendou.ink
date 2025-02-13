import { plusSuggestionPage } from "~/utils/urls";

export {};

describe("Plus suggestions page", () => {
  beforeEach(() => {
    cy.seed();
  });

  it("views suggestions status as non plus member", function () {
    cy.auth(151);
    cy.visit(plusSuggestionPage());
    cy.contains("You are suggested");
  });

  it("adds a comment and deletes one", () => {
    cy.auth();
    cy.visit(plusSuggestionPage());

    cy.getCy("suggested-user-name")
      .first()
      .invoke("text")
      .then((previousContent) => {
        cy.getCy("plus2-radio").click();

        // let's verify the radio button click actually changed stuff
        cy.getCy("suggested-user-name")
          .first()
          .invoke("text")
          .should("not.equal", previousContent);
      });

    cy.getCy("comment-button").first().click();
    cy.getCy("comment-textarea").type("Cracked!");
    cy.getCy("submit-button").click();

    cy.contains("Cracked!");

    cy.getCy("comments-summary").first().click();
    cy.getCy("delete-comment-button").first().click();
    cy.getCy("confirm-button").filter(":visible").click();
    cy.contains("Cracked!").should("not.exist");
  });

  it("adds a new suggestion, validates suggested user and deletes it", () => {
    cy.clock(new Date(Date.UTC(2022, 5, 15))); // let's make sure voting is not happening
    cy.auth();
    cy.visit(plusSuggestionPage());

    cy.getCy("new-suggest-button").click();
    cy.getCy("tier-select").select("2");
    cy.getCy("user-combobox-input").type("Sendou{enter}");

    cy.contains("This user already has access");
    cy.getCy("submit-button").should("be.disabled");

    cy.getCy("user-combobox-input").clear().type("N-ZAP{enter}");
    cy.getCy("comment-textarea").type("So good");
    cy.getCy("submit-button").click();

    cy.getCy("plus2-radio").click();
    cy.contains("N-ZAP");

    cy.getCy("comments-summary").first().click();
    cy.getCy("delete-comment-button").first().click();
    cy.getCy("confirm-button").filter(":visible").click();
    cy.contains("N-ZAP").should("not.exist");
  });
});

describe("Plus voting results page", () => {
  beforeEach(() => {
    cy.seed();
  });

  it("sees own % and results as a failed suggest", () => {
    cy.auth(200);
    cy.visit("/plus/voting/results");

    cy.contains("Sendou");
    cy.contains("your score was");
  });

  it("views results without % as member who passed", () => {
    cy.auth(1);
    cy.visit("/plus/voting/results");

    cy.contains("Sendou");
    cy.contains("passed");
  });
});
