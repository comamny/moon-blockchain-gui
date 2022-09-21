const moon = require('../../util/moon');

describe('moon', () => {
  it('converts number mojo to moon', () => {
    const result = moon.mojo_to_moon(1000000);

    expect(result).toBe(0.000001);
  });
  it('converts string mojo to moon', () => {
    const result = moon.mojo_to_moon('1000000');

    expect(result).toBe(0.000001);
  });
  it('converts number mojo to moon string', () => {
    const result = moon.mojo_to_moon_string(1000000);

    expect(result).toBe('0.000001');
  });
  it('converts string mojo to moon string', () => {
    const result = moon.mojo_to_moon_string('1000000');

    expect(result).toBe('0.000001');
  });
  it('converts number moon to mojo', () => {
    const result = moon.moon_to_mojo(0.000001);

    expect(result).toBe(1000000);
  });
  it('converts string moon to mojo', () => {
    const result = moon.moon_to_mojo('0.000001');

    expect(result).toBe(1000000);
  });
  it('converts number mojo to colouredcoin', () => {
    const result = moon.mojo_to_colouredcoin(1000000);

    expect(result).toBe(1000);
  });
  it('converts string mojo to colouredcoin', () => {
    const result = moon.mojo_to_colouredcoin('1000000');

    expect(result).toBe(1000);
  });
  it('converts number mojo to colouredcoin string', () => {
    const result = moon.mojo_to_colouredcoin_string(1000000);

    expect(result).toBe('1,000');
  });
  it('converts string mojo to colouredcoin string', () => {
    const result = moon.mojo_to_colouredcoin_string('1000000');

    expect(result).toBe('1,000');
  });
  it('converts number colouredcoin to mojo', () => {
    const result = moon.colouredcoin_to_mojo(1000);

    expect(result).toBe(1000000);
  });
  it('converts string colouredcoin to mojo', () => {
    const result = moon.colouredcoin_to_mojo('1000');

    expect(result).toBe(1000000);
  });
});
