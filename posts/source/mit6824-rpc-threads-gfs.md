---
title: "MIT6.824 Lecture 2-RPC and Threads && Lecture 3-GFS"
created: "2026-10-27"
published: "2025-02-09"
source: "https://blog.csdn.net/2201_76119663/article/details/145535492"
category: "计算机系统"
---

# MIT6.824 Lecture 2-RPC and Threads && Lecture 3-GFS

### Lecture 2-RPC and Threads

Go语言在多线程、同步，还有很好用的RPC包  
《Effective Go》  
线程是实现并发的重要工具  
在分布式系统里关注多线程的原因：

1. I/O concurrency
2. Parallelism
3. Convenience  
	Thread challenges  
	用锁解决race问题  
	Coordination  
	channels  
	sync.condition variables  
	wait group  
	Deadlock  
	用来减少竞争  
	在Go里面我们有自动化工具来检测race
```
go run -race cralwer.go
```

### Lecture 3-GFS

Big storage  
论文  
Why hard  
设计分布式系统都是为了得到更好的综合性能->就是把大量的数据分片然后分配到几台计算机上面->总是有几台计算机会出小问题，我们需要自动化的工具去纠正它->fault-tolerant(ft) system->引出容错这个话题->需要replication，至少有两份数据->可能会遇到奇怪的不一致问题，inconsistency->如果要保持一致性（consistency）开销就会变大  
Strong consistency  
单个服务器的容错能力很差  
BAD REPLICATION DESIGN  
2台server，每一个都有一块磁盘，里面都有一个key-value表  
如果要容错的话，key-value表得保持一致，也就意味着write操作得被每一个服务器处理，read就只能和一台服务器打交道了，否则无法容错，因为假如和2台打交道，失去一台服务器read就无法正常进行了  
GFS  
2003年提出  
1\. Big、Fast file system,  
2\. Global: 需要覆盖在整个数据中心上，各种应用程序都可以从上面读数据  
3\. Sharding：每一个文件都自动被GFS分割到许多server上面，这样如果有多个用户读取的时候吞吐量会变得很大  
4\. Automatic recovery  
一个GFS只运行在Single data center  
GFS是内部使用的，Google只会出售基于GFS的服务，GFS是为大型顺序文件以多种方式读写而设计的，比如说处理GB、TB这样大小的文件，只处理顺序访问，不处理随机访问。GFS没有花费过多精力让延迟变得更低，而是关注巨大的吞吐量  
Master保存有从文件名到数据存储位置的映射，实际是有两张表。然后还有许多的chunk server（块服务器），即CS、CS、CS……  
Master Data  
表一：file name->array of chunk handles/chunk IDs(chunk handles/chunk IDs肯定是要保存到磁盘中的，所以是NV->non-volatile,非易失)  
表二：handle->list of chunk servers（volatile）  
version(NV)  
primary（V）  
lease expiration(合约过期时间)  
所有的master在磁盘上都有一个log，任何时候有数据变更，就会在磁盘上的日志追加一个条目，并定期创建checkpoint->所以master的读写速度不会很快，因为ta需要把更新的信息写到磁盘中，可以使用b-tree和hash技术  
假如说master宕机了，必须重建它的状态，此时会把log弄一个快照保存到磁盘中  
READ：应用程序知道一个file name和一个想从某一个位置读取的offset，所以应用程序会把file name和offset发送给master，master从表里面读取文件名  
1\. send name and offset->master  
2\. master send chunk handle(记为H)和server列表给客户端，客户端cache这些结果  
3\. client和chunk server之一进行通信，chunk server返回data给client  
WRITE:客户端的lib有一个file name和一段想写的字节数据，客户段会发送追加数据的请求给master，并且要求告知这个文件的最后一个chunk在哪儿  
1 case: no primary,master需要找出具有最新chunk副本的chunk服务器集合->up-to-date->所以version必须是NV，保存在磁盘中的，这样version在崩溃中丢失的时候master才能正确识别哪些chunk是最新的->pick one to be primary,其他的作为secondary servers->master将版本号递增，并将其写入磁盘->将这个信息以及版本号告诉primary和secondary，primary和secondary节点都将版本号写入磁盘->primary picks offset，all replicas including the primary are told to write offset->如果所有的副本都发送了yes给primary，primary会回复success给客户端；如果有一个secondary发送错误信息给primary，primary就会回复no给client，client应该重新发起整个追加过程
