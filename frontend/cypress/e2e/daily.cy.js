describe('Guest daily play flow', () => {
  beforeEach(() => {
    cy.mockAuthGuest();
    cy.mockDailyGame('CRANE');
    cy.visit('/');
    cy.wait('@getToday');
  });

  it('loads the daily board, plays guesses, wins, shares, and disables input', () => {
    cy.contains('Daily Challenge').should('be.visible');
    cy.get('.row').should('have.length', 6);
    cy.get('.row').first().find('.cell').should('have.length', 5);

    cy.get('body').type('adieu');
    cy.get('.row').first().find('.cell').eq(0).should('have.text', 'A');
    cy.get('.row').first().find('.cell').eq(4).should('have.text', 'U');

    cy.get('body').type('{enter}');
    cy.get('.row').first().find('.cell.correct, .cell.present, .cell.absent')
      .should('have.length', 5);
    cy.get('button[aria-label="A"]').should('have.class', 'present');

    cy.window().then((win) => {
      Object.defineProperty(win.navigator, 'clipboard', {
        value: { writeText: cy.stub().as('writeText').resolves() },
        configurable: true,
      });
    });

    cy.submitWord('crane');
    cy.contains('You won!').should('be.visible');
    cy.get('.win-confetti-piece').should('exist');

    cy.contains('button', 'Share').click();
    cy.get('@writeText').should('have.been.calledOnce');
    cy.get('.keyboard button').first().should('be.disabled');
  });
});
