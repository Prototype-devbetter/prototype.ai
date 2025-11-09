import { create, all } from "mathjs";

const math = create(all, {});

export async function POST(req) {
  const { message } = await req.json();

  if (!message || typeof message !== "string") {
    return new Response(JSON.stringify({ error: "Missing message" }), { status: 400 });
  }

  const msg = message.trim().toLowerCase();

  function looksLikeMath(s) {
    const mathChars = /[0-9π\.\+\-\*\/\^\%\(\)×÷√]/;
    const containsMath = mathChars.test(s);
    const startsMathQuery = /^(what is|calculate|solve|evaluate|how much is|compute)\b/;
    return containsMath && (startsMathQuery.test(s) || /[0-9]/.test(s));
  }

  function explainSimple(expr) {
    try {
      const normalized = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/—/g, '-');
      const binaryMatch = normalized.match(/^\s*([+\-]?\d+(\.\d+)?)\s*([\+\-\*\/\^%])\s*([+\-]?\d+(\.\d+)?)\s*$/);
      if (binaryMatch) {
        const a = parseFloat(binaryMatch[1]);
        const op = binaryMatch[3];
        const b = parseFloat(binaryMatch[4]);
        let result;

        if (op === "+") result = math.add(a, b);
        else if (op === "-") result = math.subtract(a, b);
        else if (op === "*") result = math.multiply(a, b);
        else if (op === "/") result = math.divide(a, b);
        else if (op === "^") result = math.pow(a, b);
        else if (op === "%") result = math.mod(a, b);
        else result = math.evaluate(normalized);

        let step;
        if (op === "*") step = `Multiply ${a} by ${b}: ${a} × ${b} = ${result}.`;
        else if (op === "/") step = `Divide ${a} by ${b}: ${a} ÷ ${b} = ${result}.`;
        else if (op === "+") step = `Add ${a} and ${b}: ${a} + ${b} = ${result}.`;
        else if (op === "-") step = `Subtract ${b} from ${a}: ${a} - ${b} = ${result}.`;
        else if (op === "^") step = `${a} to the power of ${b} = ${result}.`;
        else step = `Result: ${result}`;

        return { ok: true, answer: `${result}`, explanation: step };
      }

      const value = math.evaluate(normalized);
      return { ok: true, answer: String(value), explanation: `I evaluated ${expr} = ${value}.` };
    } catch {
      return { ok: false };
    }
  }

  if (looksLikeMath(msg)) {
    let expr = msg.replace(/^(what is|calculate|solve|evaluate|how much is|compute)\s*/i, "").trim();
    expr = expr.replace(/\?+$/, "");
    const wordToSymbol = {
      " times ": " * ",
      " multiplied by ": " * ",
      " divide ": " / ",
      " divided by ": " / ",
      " plus ": " + ",
      " minus ": " - ",
      " power ": " ^ ",
      " squared": "^2",
      " cubed": "^3"
    };
    for (const k in wordToSymbol) expr = expr.replace(new RegExp(k, "gi"), wordToSymbol[k]);

    const simple = explainSimple(expr);
    if (simple.ok) {
      return new Response(JSON.stringify({
        reply: `${simple.explanation} Answer: ${simple.answer}`
      }), { status: 200 });
    }

    try {
      const val = math.evaluate(expr);
      return new Response(JSON.stringify({ reply: `I evaluated "${expr}" and got ${val}.` }), { status: 200 });
    } catch {
      return new Response(JSON.stringify({
        reply: `I couldn't evaluate that expression reliably. Try simple format like "2*2".`
      }), { status: 200 });
    }
  }

  const replies = [
    "Let's break that down step by step!",
    "Interesting question — think of it like this:",
    "Hmm, try to visualize it this way:",
    "That’s a great question! Let me explain clearly.",
    "Let’s solve this together:"
  ];

  let answer = "";
  if (msg.includes("pythagoras")) {
    answer = "Pythagoras' theorem says a² + b² = c² — it connects the sides of a right triangle!";
  } else if (msg.includes("derivative")) {
    answer = "The derivative of xⁿ is n×xⁿ⁻¹ — it’s how you find a slope at a point!";
  } else if (msg.includes("integral")) {
    answer = "An integral is like adding up tiny slices to find the total area under a curve.";
  } else {
    const randomReply = replies[Math.floor(Math.random() * replies.length)];
    answer = `${randomReply} So you're asking about "${message}"? Here's how to think about it...`;
  }

  return new Response(JSON.stringify({ reply: answer }), { status: 200 });
}
