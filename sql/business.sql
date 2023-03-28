USE [Handel_Desarrollo]
GO

/****** Object:  Table [dbo].[business]    Script Date: 29/01/2020 01:11:28 p. m. ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[business](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[db_name] [nvarchar](100) NULL,
	[licence] [nvarchar](200) NULL,
 CONSTRAINT [PK_business] PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO


