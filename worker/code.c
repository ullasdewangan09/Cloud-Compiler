#include<stdio.h>
#include<ctype.h>
#include<string.h>

char keywords[10][10] = {"int","float","if","else","while","return","for","char","double","void"};

int isKeyword(char buffer[]){
int i;
for(i=0;i<10;i++){
if(strcmp(buffer,keywords[i])==0)
return 1;
}
return 0;
}

int isOperator(char ch){
if(ch=='+'||ch=='-'||ch=='*'||ch=='/'||ch=='='||ch=='>'||ch=='<')
return 1;
return 0;
}

int isSpecialSymbol(char ch){
if(ch=='('||ch==')'||ch=='{'||ch=='}'||ch==';'||ch==',')
return 1;
return 0;
}

int main(){
char input[500];
char buffer[50];
int i=0,j=0;

fgets(input,500,stdin);

while(input[i]!='\0'){

if(isalpha(input[i])){
buffer[j++]=input[i];

while(isalnum(input[i+1])){
buffer[j++]=input[++i];
}

buffer[j]='\0';

if(isKeyword(buffer))
printf("%s -> Keyword\n",buffer);
else
printf("%s -> Identifier\n",buffer);

j=0;
}

else if(isdigit(input[i])){
buffer[j++]=input[i];

while(isdigit(input[i+1])){
buffer[j++]=input[++i];
}

buffer[j]='\0';

printf("%s -> Number\n",buffer);

j=0;
}

else if(isOperator(input[i])){
printf("%c -> Operator\n",input[i]);
}

else if(isSpecialSymbol(input[i])){
printf("%c -> Special Symbol\n",input[i]);
}

i++;
}

return 0;
}