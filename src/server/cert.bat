set PATH=%PATH%;E:\OpenSSL-Win64\bin
mkdir cert
openssl genrsa -out cert/server.key 1024
openssl rsa -in cert/server.key -pubout -out cert/server.pem
openssl genrsa -out cert/client.key 1024
openssl rsa -in cert/client.key -pubout -out cert/client.pem
openssl genrsa -out cert/ca.key 
openssl rsa -in cert/ca.key -pubout -out cert/ca.pem

openssl req -new -key cert/ca.key -out cert/ca.csr
openssl x509 -req -in cert/ca.csr -signkey cert/ca.key -out cert/ca.crt -days 3650

openssl req -new -key cert/server.key -out cert/server.csr
openssl x509 -req -CA cert/ca.crt -CAkey cert/ca.key -CAcreateserial -in cert/server.csr -out cert/server.crt -days 3650

openssl req -new -key cert/client.key -out cert/client.csr
openssl x509 -req -CA cert/ca.crt -CAkey cert/ca.key -CAcreateserial -in cert/client.csr -out cert/client.crt -days 3650