export function expandHTMLAbbreviation(
    abbreviation: string
): string | null {

    if (abbreviation === "!") {

        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>

</body>
</html>`;
    }

    if (abbreviation === "html:5") {
        return expandHTMLAbbreviation("!");
    }

    const simpleTag =
        abbreviation.match(
            /^([a-zA-Z][\w-]*)$/
        );

    if (simpleTag) {

        const tag =
            simpleTag[1];

        return `<${tag}></${tag}>`;
    }

    const classTag =
        abbreviation.match(
            /^([a-zA-Z][\w-]*)\.([\w-]+)$/
        );

    if (classTag) {

        const tag =
            classTag[1];

        const className =
            classTag[2];

        return `<${tag} class="${className}"></${tag}>`;
    }

    const idTag =
        abbreviation.match(
            /^([a-zA-Z][\w-]*)#([\w-]+)$/
        );

    if (idTag) {

        const tag =
            idTag[1];

        const id =
            idTag[2];

        return `<${tag} id="${id}"></${tag}>`;
    }

    const multiplication =
        abbreviation.match(
            /^([a-zA-Z][\w-]*)\*(\d+)$/
        );

    if (multiplication) {

        const tag =
            multiplication[1];

        const count =
            Number(multiplication[2]);

        let result = "";

        for (
            let i = 1;
            i <= count;
            i++
        ) {
            result +=
                `<${tag}></${tag}>`;

            if (i < count) {
                result += "\n";
            }
        }

        return result;
    }

    const child =
        abbreviation.match(
            /^([a-zA-Z][\w-]*)>([a-zA-Z][\w-]*)$/
        );

    if (child) {

        const parent =
            child[1];

        const childTag =
            child[2];

        return `<${parent}><${childTag}></${childTag}></${parent}>`;
    }

    return null;
}
