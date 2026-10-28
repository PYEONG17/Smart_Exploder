export const LAB_FORMULA_RESERVED_IDENTIFIERS = new Set([
  "abs", "cos", "e", "exp", "log", "max", "min", "pi", "round", "sin", "sqrt", "tan",
  "__proto__", "constructor", "prototype", "toString",
]);

const FUNCTIONS: Record<string, (...values: number[]) => number> = {
  abs: Math.abs,
  cos: Math.cos,
  exp: Math.exp,
  log: Math.log,
  max: Math.max,
  min: Math.min,
  round: Math.round,
  sin: Math.sin,
  sqrt: Math.sqrt,
  tan: Math.tan,
};

type Token = { type: "number" | "identifier" | "operator"; value: string };

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < source.length) {
    const remaining = source.slice(index);
    const whitespace = remaining.match(/^\s+/);
    if (whitespace) {
      index += whitespace[0].length;
      continue;
    }
    const number = remaining.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/i);
    if (number) {
      tokens.push({ type: "number", value: number[0] });
      index += number[0].length;
      continue;
    }
    const identifier = remaining.match(/^[A-Za-z_][A-Za-z0-9_]*/);
    if (identifier) {
      tokens.push({ type: "identifier", value: identifier[0] });
      index += identifier[0].length;
      continue;
    }
    const character = source[index];
    if ("+-*/^(),".includes(character)) {
      tokens.push({ type: "operator", value: character });
      index += 1;
      continue;
    }
    throw new Error(`Ký tự không hợp lệ trong công thức: ${character}`);
  }
  return tokens;
}

export function evaluateLabFormula(
  source: string,
  variables: Record<string, number>,
): number {
  const tokens = tokenize(source);
  let position = 0;

  const peek = () => tokens[position]?.value;
  const consume = (expected?: string) => {
    const token = tokens[position++];
    if (!token || (expected && token.value !== expected)) {
      throw new Error("Công thức không đúng cú pháp.");
    }
    return token;
  };

  const primary = (): number => {
    const token = consume();
    if (token.value === "(") {
      const value = expression();
      consume(")");
      return value;
    }
    if (token.type === "number") return Number(token.value);
    if (token.type === "identifier") {
      if (peek() === "(") {
        const fn = FUNCTIONS[token.value];
        if (!fn) throw new Error(`Hàm không được hỗ trợ: ${token.value}`);
        consume("(");
        const args: number[] = [];
        if (peek() !== ")") {
          do {
            args.push(expression());
            if (peek() !== ",") break;
            consume(",");
          } while (true);
        }
        consume(")");
        return fn(...args);
      }
      if (token.value === "pi") return Math.PI;
      if (token.value === "e") return Math.E;
      if (!Object.hasOwn(variables, token.value)) {
        throw new Error(`Biến chưa được khai báo: ${token.value}`);
      }
      return variables[token.value];
    }
    throw new Error("Công thức không đúng cú pháp.");
  };

  const unary = (): number => {
    if (peek() === "+") {
      consume("+");
      return unary();
    }
    if (peek() === "-") {
      consume("-");
      return -unary();
    }
    return power();
  };

  const power = (): number => {
    const left = primary();
    if (peek() === "^") {
      consume("^");
      return left ** unary();
    }
    return left;
  };

  const term = (): number => {
    let value = unary();
    while (peek() === "*" || peek() === "/") {
      const operator = consume().value;
      const right = unary();
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  };

  const expression = (): number => {
    let value = term();
    while (peek() === "+" || peek() === "-") {
      const operator = consume().value;
      const right = term();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  };

  if (!tokens.length) throw new Error("Công thức không được để trống.");
  const result = expression();
  if (position !== tokens.length) throw new Error("Công thức không đúng cú pháp.");
  if (!Number.isFinite(result)) throw new Error("Công thức không tạo ra kết quả hữu hạn.");
  return result;
}

export function validateLabFormula(
  source: string,
  variableIds: string[],
): string | null {
  try {
    evaluateLabFormula(
      source,
      Object.fromEntries(variableIds.map((id) => [id, 1])),
    );
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : "Công thức không hợp lệ.";
  }
}